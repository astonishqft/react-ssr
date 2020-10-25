import React, { Component } from 'react';
import axios from 'axios';
import { isBrowser } from '@/utils/utils';
import styles from './index.less';

class Home extends Component {
  render() {
    const { home: { list = [] } } = this.props;

    return (
      <div className={styles.container}>
        <h2>Home page</h2>
        <ul>
          {
            list && list.map((item) => <li key={item.id}>{item.title}</li>)
          }
        </ul>
      </div>
    );
  }
}

Home.getInitialProps = async () => {
  const entry = isBrowser() ? '/users' : 'https://www.fastmock.site/mock/545c01c52d578bf9ecf5ec775968acda/api/list';
  try {
    const { data: { data: list } } = await axios(entry);

    return {
      home: {
        list,
      },
    };
  } catch (error) {
    console.log('error', error)
  }
};

export default Home;
