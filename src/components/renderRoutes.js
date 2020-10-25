import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';

const renderRoutes = (routersConfig, restProps) => {
  const renderRoute = (config) =>
    config.map((item) => {
      if (item.children && item.children.length) {
        return renderRoute(item.children);
      }
      return (
        <Route exact key={item.path} path={item.path}>
          {item.component}
        </Route>
      );
    });

  return (
    <Switch>
      {renderRoute(routersConfig)}
      <Redirect exact to="/" from="/" />
    </Switch>
  );
}

export default renderRoutes;
