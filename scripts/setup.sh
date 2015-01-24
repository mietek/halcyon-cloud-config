#!/usr/bin/env bash

set -o pipefail

{{setupEnvVars}}


{{setupPartSh}}


retry () {
	while true; do
		if "$@" >'/var/log/setup-retry.log' 2>&1; then
			break
		fi
		sed -u 's/^/       /' <'/var/log/setup-retry.log' >&2
		echo '-----> Retrying...' >&2
	done
}


install_halcyon () {
	echo '-----> Welcome to Haskell on DigitalOcean' >&2

	echo "$$" >'/var/run/setup.pid'
	chown app:app -R '/app' '/var/log/setup.log' '/var/run/setup.pid' || return 1

	echo '-----> Preparing installation' >&2

	prepare_install || return 1

	echo '-----> Installing OS packages' >&2

	install_os_packages || return 1

	local url base_url branch
	url="${HALCYON_URL:-https://github.com/mietek/halcyon}"
	base_url="${url%#*}"
	branch="${url#*#}"
	if [[ "${branch}" == "${base_url}" ]]; then
		branch='master'
	fi

	echo >&2
	echo -n '-----> Installing Halcyon...' >&2

	retry git clone -q "${base_url}" '/app/halcyon'

	local commit_hash
	if ! commit_hash=$(
		cd '/app/halcyon' &&
		git checkout -q "${branch}" >'/dev/null' 2>&1 &&
		git log -n 1 --pretty='format:%h'
	); then
		echo 'error' >&2
		return 1
	fi
	echo " done, ${commit_hash:0:7}" >&2

	HALCYON_NO_SELF_UPDATE=1 \
		source '/app/halcyon/src.sh' || return 1
	chown app:app -R '/app' || return 1
}


if ! install_halcyon >'/var/log/setup.log' 2>&1; then
	echo '   *** ERROR: Failed to install Halcyon' >>'/var/log/setup.log'
	exit 0
fi


install_app () {
	local clone_dir
	clone_dir=$( get_tmp_dir 'setup-clone' ) || return 1

	log_begin 'Cloning {{appSourceUrl}}...'

	local commit_hash
	if ! commit_hash=$( git_clone_over '{{appSourceUrl}}' "${clone_dir}" ); then
		log_end 'error'
		log_error 'Failed to clone app'
		return 1
	fi
	log_end "done, ${commit_hash:0:7}"

	local label executable
	if ! label=$(
		sudo -u app bash -c "
			{{setupEnvVars}}
			export HOME='/app'
			export HALCYON_NO_SELF_UPDATE=1
			/app/halcyon/halcyon label \"${clone_dir}\" 2>'/dev/null'
		"
	) || ! executable=$(
		sudo -u app bash -c "
			{{setupEnvVars}}
			export HOME='/app'
			export HALCYON_NO_SELF_UPDATE=1
			/app/halcyon/halcyon executable \"${clone_dir}\" 2>'/dev/null'
		"
	)
	then
		log_error 'Failed to detect app'
		return 1
	fi

	sudo -u app bash -c "
		{{setupEnvVars}}
		export HOME='/app'
		export HALCYON_NO_SELF_UPDATE=1
		export HALCYON_NO_CLEAN_CACHE=1
		export HALCYON_INTERNAL_NO_ANNOUNCE_INSTALL=1
		/app/halcyon/halcyon install \"${clone_dir}\"
	" || return 1

	local app_command
	app_command='{{appCommand}}'
	if [[ -z "${app_command}" ]]; then
		if [[ ! -f "${clone_dir}/Procfile" ]] ||
			! app_command=$(
				filter_matching '^web: ' <"${clone_dir}/Procfile" |
				match_exactly_one |
				sed 's/^web: //'
			)
		then
			app_command="/app/bin/${executable}"
		fi
	fi

	if ! register_app "${executable}" "${app_command}"; then
		log_error 'Failed to register app'
		return 1
	fi

	if ! start_app "${executable}"; then
		log_error 'Failed to start app'
		return 1
	fi

	local ip_address
	ip_address=$( curl -s http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address ) || true

	log
	log_label 'App deployed:' "${label}"
	log
	log 'To see the app:'
	log_indent "$ open http://${ip_address}:{{appPort}}"
}


if ! install_app 2>>'/var/log/setup.log'; then
	log
	log
	log_error 'Failed to deploy app' 2>>'/var/log/setup.log'
fi
