#!/bin/bash

SAVEIFS=$IFS
IFS=$'\n'
luvio_versions=( $( yarn list --pattern "@luvio" --no-color | grep @luvio | while read line; do awk -F'@' '{print $3}'; done ) )
lds_versions=( $( lerna list -apl | while read line; do awk -F':' '{print $3}'; done ) )
filtered_luvio_versions=( $( for i in ${luvio_versions[@]}; do echo $i; done | sort -u ) )
filtered_lds_versions=( $( for i in ${lds_versions[@]}; do echo $i; done | sort -u ) )

echo "Detected @luvio versions: ${filtered_luvio_versions[@]}"
echo "Detected @salesforce/lds versions: ${filtered_lds_versions[@]}"

IFS=$SAVEIFS

if [ "${#filtered_luvio_versions[@]}" -eq 1 ] && [ "${#filtered_lds_versions[@]}" -eq 1 ]
then 
  echo "Build depencencies OK, only one version of luvio and lds detected"
  exit 0
else
  echo "Error: Multiple versions of luvio or lds detected"
  exit 1
fi