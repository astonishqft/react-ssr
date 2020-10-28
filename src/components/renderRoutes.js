import React, { useState, useEffect } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';

const RouteWithProps = ({ path, exact, strict, render, location, sensitive, ...rest }) => (
  <Route
    path={path}
    exact={exact}
    strict={strict}
    location={location}
    sensitive={sensitive}
    render={(props) => render({ ...props, ...rest })}
  />
);

function withRoutes(route) {
  const { component } = route;

  let Component = (args) => {
    const { render, ...props } = args;
    return render(props);
  };

  if (component) {
    const OldComponent = Component;
    Component = props => {
      const [data, setData] = useState(typeof window !== 'undefined' ? window.__GLOBAL_PAGE_PROPS__ : {});
      useEffect(() => {
        // When enter the page for the first time, need to use window.__ICE_PAGE_PROPS__ as props
        // And don't need to re-request to switch routes
        // Set the data to null after use, otherwise other pages will use
        async function fetchData() {
          if (typeof window !== 'undefined') {
            if (window.__GLOBAL_PAGE_PROPS__) {
              window.__GLOBAL_PAGE_PROPS__ = null;
            } else if (component.getInitialProps) {
              // When the server does not return data, the client calls getinitialprops
              (async () => {
                const pathname = window && window.location && window.location.pathname
                const ctx = { }
                const result = await component.getInitialProps({ pathname, ctx });
                setData(result);
              })();
            }
          }
        }
        fetchData();

      }, []);
      return (
        <OldComponent {...Object.assign({}, props, data)} />
      );
    }
  }

  const ret = (args) => {
    const { render, ...rest } = args;
    return (
      <RouteWithProps
        {...rest}
        render={(props) => {
          return <Component {...props} route={route} render={render} />;
        }}
      />
    );
  };
  return ret;
}

export default function renderRoutes(routes = [], extraProps = {}, switchProps = {}) {
  return routes ? (
    <Switch {...switchProps}>
      {routes.map((route, i) => {
        if (route.redirect) {
          return (
            <Redirect
              key={route.key || i}
              from={route.path}
              to={route.redirect}
              exact={route.exact}
              strict={route.strict}
            />
          );
        }
        const RouteRoute = withRoutes(route);
        return (
          <RouteRoute
            key={route.key || i}
            path={route.path}
            exact={route.exact}
            strict={route.strict}
            sensitive={route.sensitive}
            render={(props) => {
              const childRoutes = renderRoutes(route.routes, extraProps, {
                location: props.location,
              });
              if (route.component) {
                const newProps = { route, ...props, ...extraProps, }
                let { component: Component } = route;
                return (
                  <Component {...newProps} route={route}>
                    {childRoutes}
                  </Component>
                );
              } else {
                return childRoutes;
              }
            }}
          />
        );
      })}
      <Route component={require('@/pages/404').default} />
    </Switch>
  ) : null;
}
