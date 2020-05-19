# node-risk
Insight into an npm repo:

- Downloads the tarball from node
- Extracts it to a temporary folder
- Clones the claimed linked repository
- Diff the published folder with the repository folder

## Quick check
Using npx you can quickly check the differences between a npm package and it's claimed repository.

```
npx npm-vs-repo PACKAGE_NAME
```

## Development
Clone and `npm i` this repo then run `./bin/risk PACKAGE_NAME` to perform the above actions.
