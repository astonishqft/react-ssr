import React, { Component } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { isBrowser } from '@/utils/utils';
import styles from './index.less';

class Home extends Component {
  render() {
    const { home = {}} = this.props;
    const { list = []} = home;

    return (
      <div className={styles.container}>
        <div>
          <div>
            a标签跳转到：<a href="/login">Login Page</a>
          </div>
          <div>
            Link标签跳转到 <Link to="/login">Login Page</Link>
          </div>
        </div>
        <h2 className={styles.title}>Home page</h2>
        <ul className={styles.list}>
          {
            list && list.map((item) => <li key={item.id}>{item.title}</li>)
          }
        </ul>
      </div>
    );
  }
}

Home.getInitialProps = async () => {
  const entry = 'https://www.fastmock.site/mock/545c01c52d578bf9ecf5ec775968acda/api/list';
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
