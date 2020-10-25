const routersConfig = [
  {
    path: '/',
    name: 'Home',
    exact: true,
    component: require('pages/Home').default,
  }, {
    path: '/login',
    name: 'Login',
    exact: true,
    component: require('pages/Login').default,
  },
];

export default routersConfig;
