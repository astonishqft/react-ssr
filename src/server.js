
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

    console.log('=====>>>>5555', matchedRoute);
    if (matchedRoute) {
      return matchedRoute.children
        ? findMatchRoute(matchedRoute.children)
        : matchedRoute
    }
    return null
  }
  const matchedRoute = findMatchRoute(routes)

  console.log('=====>>>>66666', matchedRoute);

  return matchedRoute && matchedRoute.component
}

// function test  = async () => {

// }

const serverRender = async ({ pathname }) => {
  let pageInitialProps = {}
  try {
    const PageComponent = getComponentByPath(routersConfig, pathname);
    const getInitialProps = PageComponent && PageComponent.getInitialProps;

    console.log('====>>>> pathname', pathname);

    console.log('====>>>> PageComponent', PageComponent);

    // console.log('====>>>> PageComponent', PageComponent());
    // console.log('====>>>> PageComponent', PageComponent().getInitialProps);




    console.log('====>>>> getInitialProps', getInitialProps);

    console.log('====>>>> getInitialProps', getInitialProps().then(data => console.log(data, 66666)));




    if (getInitialProps) {
      console.log('[SSR]', 'getting initial props of page component')
      pageInitialProps = await getInitialProps()
    }
  } catch (error) {
    console.log('[SSR] generate html template error')
  }

  const RootComponent = () => (
    <StaticRouter location={pathname} static={{}}>
      {renderRouters(routersConfig)}
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
