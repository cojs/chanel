BIN = ./node_modules/.bin/

test:
	@$(BIN)mocha \
		--harmony \
		--require should \
		--reporter spec \
		--bail

build:
	@mkdir -p build
	@$(BIN)regenerator lib/index.js > build/index.js

.PHONY: test build