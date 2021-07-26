import EmberRouter from '@ember/routing/router';
import AddonDocsRouter, { docsRoute } from 'ember-cli-addon-docs/router';
import config from 'dummy/config/environment';
export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function() {
  docsRoute(this, function() {
    this.route('quickstart');
  });

  this.route('index', { path: '/' });

  this.route('not-found', { path: '/*path' });
});

