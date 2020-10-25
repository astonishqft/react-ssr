
import React from 'react';
import { StaticRouter } from 'react-router-dom';
import { renderToString } from 'react-dom/server';
import renderRouters from '@/components/renderRoutes';
import routersConfig from '@/config/routes';
import * as cheerio from 'cheerio';
import { matchPath } from 'react-router';

function getComponentByPath(routes, currPath) {
  function findMatchRoute(routeList) {
    const matchedRoute = routeList.find(route => {
      return matchPath(currPath, route)
    })
    if (matchedRoute) {
      return matchedRoute.children
        ? findMatchRoute(matchedRoute.children)
        : matchedRoute
    }
    return null
  }
  const matchedRoute = findMatchRoute(routes)
  return matchedRoute && matchedRoute.component
}

const serverRender = async ({ pathname }) => {
  let pageInitialProps = {}
  try {
    const PageComponent = getComponentByPath(routersConfig, pathname);
    const getInitialProps = PageComponent && PageComponent.getInitialProps;

    console.log('====>>>> pathname', pathname);

    if (getInitialProps) {
      console.log('[SSR]', 'getting initial props of page component')
      pageInitialProps = await getInitialProps();

      console.log('====>>>> pageInitialProps', pageInitialProps);
    }
  } catch (error) {
    console.log('[SSR] generate html template error')
  }

  const RootComponent = () => (
    <StaticRouter location={pathname} static={{}}>
      {renderRouters(routersConfig, pageInitialProps)}
    </StaticRouter>
  );


  const bundleContent = renderToString(RootComponent());

  const $ = cheerio.load('__SERVER_HTML_TEMPLATE__');

  $('#root').append(bundleContent);

  $('head').append(
    `<script>window.__GLOBAL_PAGE_PROPS__ = ${JSON.stringify(
      pageInitialProps,
    )};</script>`);

  const html = $.html();
  return {
    html,
  }
}

export default serverRender;
