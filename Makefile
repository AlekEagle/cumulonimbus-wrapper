all: clean build_only

clean:
	rm -rf ./dist

tsc = ./node_modules/.bin/tsc
VERSION := $(shell jq -r '.version' ./package.json)

build_esm:
	$(tsc) -b tsconfig.esm.json

	# this probably obliterates the source map but that sounds like a problem for later me
	sed -i "s/hiiamversionsentinelpleasereplacemewiththeversionatbuildtimethanks/$(VERSION)/g" ./dist/esm/index.js

build_cjs:
	$(tsc) -b tsconfig.cjs.json

	echo '{"type": "commonjs"}' > ./dist/cjs/package.json
	echo 'module.exports = require("./index.js").default;' > ./dist/cjs/loader.js

	sed -i "s/hiiamversionsentinelpleasereplacemewiththeversionatbuildtimethanks/$(VERSION)/g" ./dist/cjs/index.js

build_only: build_esm build_cjs
