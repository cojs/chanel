BIN = ./node_modules/.bin/
NODE ?= gnode

test:
	@$(NODE) $(BIN)mocha \
		--harmony-generators \
		--require should \
		--reporter spec \
		--bail

.PHONY: test