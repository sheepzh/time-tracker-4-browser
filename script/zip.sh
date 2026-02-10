#!/bin/bash

FOLDER=$(
    cd "$(dirname "$0")/.."
    pwd
)
TARGET_PATH="${FOLDER}/aaa"

EXCLUDE_ARGS=""

if [ -f "${FOLDER}/.gitignore" ]; then
    while IFS= read -r line || [ -n "$line" ]; do
        [[ -z "$line" || "$line" =~ ^# ]] && continue
        line=$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        [ -z "$line" ] && continue

        pattern="${line#/}"
        EXCLUDE_ARGS="${EXCLUDE_ARGS} --exclude=${pattern}"
    done < "${FOLDER}/.gitignore"
fi

EXCLUDE_ARGS="${EXCLUDE_ARGS} --exclude=.git"

cd "${FOLDER}"
COPYFILE_DISABLE=1 tar -zcf ${TARGET_PATH} ${EXCLUDE_ARGS} ./
