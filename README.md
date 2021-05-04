# monkey-ts

An implementation of a [Monkey](https://monkeylang.org) interpreter & compiler in [Typescript](http://typescriptlang.org).

Written while reading [Writing an Interpreter in Go](https://interpreterbook.com/), but for people who weren't really wowed by Go. Also covers the sequel, [Writing a Compiler in Go](https://compilerbook.com).

Started using [generator-xavdid](https://github.com/xavdid/generator-xavdid).

## Notes

Oddly, the `VM` implementation is comparable in speed (if not a little faster) than the `eval` version. There are profiles in the `profiling` directory.

## Future Projects

I'd like to learn more about Prettier and ESLint work by making Monkey compatible with them.
