import React, { Component } from 'react'
import ReactDOM from 'react-dom';
import { Router } from 'react-router-dom';
import { createBrowserHistory } from 'history'
import renderRouters from '@/components/renderRoutes';
import routersConfig from '@/config/routes';

const history = createBrowserHistory();

class App extends Component {
  render() {
    return (
      <Router history={history}>{renderRouters(routersConfig)}</Router>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
