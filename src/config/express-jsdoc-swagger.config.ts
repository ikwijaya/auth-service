import * as path from 'path';
import appConfig from './app.config';

const {
  docs: { swaggerUIPath, apiDocsPath },
} = appConfig;
const baseDir = path.join(__dirname, '../../');
const expressJSDocSwaggerConfig = {
  info: {
    version: '1.0.0',
    title: '⚡️GundalaPetir⚡️',
    description: 'Api specs for Gundala CMS',
    license: {
      name: 'MIT',
    },
  },
  security: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
    },
  },
  baseDir,
  // Glob pattern to find your jsdoc files (multiple patterns can be added in an array)
  filesPattern: `${baseDir}/src/**/*.route-spec.ts` as string & {
    _kind?: 'MyString';
  },
  // URL where SwaggerUI will be rendered
  swaggerUIPath,
  // Expose OpenAPI UI
  exposeSwaggerUI: true,
  // Expose Open API JSON Docs documentation in `apiDocsPath` path.
  exposeApiDocs: true,
  // Open API JSON Docs endpoint.
  apiDocsPath,
  // Set non-required fields as nullable by default
  notRequiredAsNullable: false,
  // You can customize your UI options.
  // you can extend swagger-ui-express config. You can checkout an example of this
  // in the `example/configuration/swaggerOptions.js`
  swaggerUiOptions: {},
  // multiple option in case you want more that one instance
  multiple: true,
};

export default expressJSDocSwaggerConfig;
