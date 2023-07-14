all: clean build_only

clean:
	rm -rf ./dist

build_esm:
	tsc -b tsconfig.esm.json

build_cjs:
	tsc -b tsconfig.cjs.json
	echo '{"type": "commonjs"}' > ./dist/cjs/package.json
	echo 'module.exports = require("./index.js").default;' > ./dist/cjs/loader.js

build_only: build_esm build_cjs