import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { CLIENT_ID, CLIENT_SECRET, ACCESS_TOKEN, PROXY, STATUS } from './utils/constant';
import { queryParse, axiosJSON } from './utils/helper';
import Octokit from '@octokit/rest';
import Alert from 'antd/lib/alert'; // 加载 JS

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      failed: false,
    };
    this.octokit = new Octokit();
    this.info = {};
    this.collectInfo = {};
    this.y2018 = new Date('2018-01-01');
    this.y2019 = new Date('2019-01-01');
    this.per_page = 100;

    this.setToken();
    this.token = localStorage.getItem(ACCESS_TOKEN);
    if (this.token) {
      this.authenticate();
      this.calc();
    }
  }

  calc = async () => {
    const promiseArr = await this.fetchInfo();
    // 等待全部异步请求结束
    await Promise.all(promiseArr);
    this.analysisSingle();
    this.analysisCollect();
    console.log(this.info);
    console.log(this.collectInfo);
  };

  // 综合所有仓库做分析
  analysisCollect = () => {
    this.getCollectLanguage();
    this.getCollectRepoNums();
    this.getCollectCommitNums();
    this.getCollectSpecialDay();
    this.getCollectLatestDay();
    this.getCollectCommitDays();
    this.getCollectPeriod();
    this.getCollectForget();
  };

  // 分析被遗忘的编程语言
  getCollectForget = () => {
    // 计算每种语言最后一次提交时间的hash
    this.collectInfo.languageLastCommit = {};
    const hashObject = this.collectInfo.languageLastCommit;
    this.info.repos.forEach(repo => {
      const key = repo.language;
      if (key) {
        // 最晚提交时间
        if (key in hashObject) {
          const current = new Date(repo.commitTime[0]);
          hashObject[key] = hashObject[key].getTime() > current.getTime() ? hashObject[key] : current;
        } else {
          hashObject[key] = new Date(repo.commitTime[0]);
        }
      }
    });
    // 计算最后一次提交最早的语言
    this.collectInfo.forget = {
      language: '',
      date: '',
    };
    const forget = this.collectInfo.forget;
    Object.keys(hashObject).forEach(key => {
      if (forget.date === '' || hashObject[key].getTime() < forget.date.getTime()) {
        forget.language = key;
        forget.date = hashObject[key];
      }
    });
  };

  // 分析所有的时间段提交情况，并选出提交最多的时间端
  getCollectPeriod = () => {
    this.collectInfo.period = {
      morningNums: 0,
      afternoonNums: 0,
      eveningNums: 0,
      dawnNums: 0,
    };
    const period = this.collectInfo.period;
    this.info.repos.forEach(repo => {
      period.morningNums += repo.morningNums;
      period.afternoonNums += repo.afternoonNums;
      period.eveningNums += repo.eveningNums;
      period.dawnNums += repo.dawnNums;
    });
    this.collectInfo.likePeriod = {
      name: '',
      count: 0,
    };
    const likePeriod = this.collectInfo.likePeriod;
    Object.keys(period).forEach(key => {
      if (period[key] > likePeriod.count) {
        likePeriod.count = period[key];
        likePeriod.name = key;
      }
    });
    if (likePeriod.name === 'morningNums') {
      likePeriod.name = '上午';
    } else if (likePeriod.name === 'afternoonNums') {
      likePeriod.name = '下午';
    } else if (likePeriod.name === 'eveningNums') {
      likePeriod.name = '晚上';
    } else if (likePeriod.name === 'dawnNums') {
      likePeriod.name = '凌晨';
    }
  };

  // 分析所有仓库中提交天数最多的一个
  getCollectCommitDays = () => {
    const repo = this.info.repos.reduce((pre, cur) => (pre.sumDays > cur.sumDays ? pre : cur));
    this.collectInfo.mostDay = {
      count: repo.sumDays,
      repo: repo.repo,
    };
  };

  // 分析提交代码最晚的一天
  getCollectLatestDay = () => {
    const repo = this.info.repos.reduce((pre, cur) => {
      if (cur.latestTime === '') {
        return pre;
      }
      if (pre.latestTime === '') {
        return cur;
      }
      const date = this.compareLate(pre.latestTime, cur.latestTime);
      return pre.latestTime.getTime() === date.getTime() ? pre : cur;
    });
    this.collectInfo.latestDay = {
      date: repo.latestTime,
      repo: repo.repo,
    };
  };

  // 分析对某个仓库提交次数特别多的一天，特殊的一天
  getCollectSpecialDay = () => {
    const repo = this.info.repos.reduce((pre, cur) => (pre.commitMostDay.count > cur.commitMostDay.count ? pre : cur));
    this.collectInfo.specialDay = {
      date: repo.commitMostDay.date,
      repo: repo.repo,
      count: repo.commitMostDay.count,
    };
  };

  // 分析提交总次数
  getCollectCommitNums = () => {
    this.collectInfo.commitNums = this.info.repos.reduce((pre, cur) =>
      typeof pre === 'number' ? pre + cur.commitTime.length : pre.commitTime.length + cur.commitTime.length
    );
  };

  // 分析对多少仓库提交过代码
  getCollectRepoNums = () => {
    this.collectInfo.repoNums = this.info.repos.length;
  };

  // 分析编程语言数量，用的最多的年度编程语言
  getCollectLanguage = () => {
    // 计算年度编程语言
    this.collectInfo.mostLanguage = {
      name: '',
      repoNums: 0,
    };
    // 语言各有多少仓库
    this.collectInfo.language = {};
    const hashObject = this.collectInfo.language;
    this.info.repos.forEach(repo => {
      if (repo.language) {
        const key = repo.language;
        if (key in hashObject) {
          hashObject[key]++;
        } else {
          hashObject[key] = 1;
        }
        if (hashObject[key] > this.collectInfo.mostLanguage.repoNums) {
          this.collectInfo.mostLanguage.name = key;
          this.collectInfo.mostLanguage.repoNums = hashObject[key];
        }
      }
    });
    // 共用了多少种语言
    this.collectInfo.languageNums = Object.keys(hashObject).length;
    // 计算总提交数
    this.collectInfo.mostLanguage.commitNums = 0;
    this.info.repos.forEach(repo => {
      if (repo.language === this.collectInfo.mostLanguage.name) {
        this.collectInfo.mostLanguage.commitNums += repo.commitTime.length;
      }
    });
  };

  // 对每个仓库做分析
  analysisSingle = () => {
    this.getSingleCommitDays();
    this.getSingleLatestTime();
    this.getSinglePeriodNums();
  };

  // 分析每个仓库 上午，下午，晚上，凌晨的提交次数
  getSinglePeriodNums = () => {
    this.info.repos.forEach(repo => {
      repo.morningNums = 0;
      repo.afternoonNums = 0;
      repo.eveningNums = 0;
      repo.dawnNums = 0;
      repo.commitTime.forEach(time => {
        const hours = new Date(time).getHours();
        if (hours >= 0 && hours < 6) {
          repo.dawnNums++;
        } else if (hours >= 6 && hours < 12) {
          repo.morningNums++;
        } else if (hours >= 12 && hours < 18) {
          repo.afternoonNums++;
        } else if (hours >= 18 && hours < 24) {
          repo.eveningNums++;
        }
      });
    });
  };

  // 分析每个仓库提交最多的天数 和 提交的总天数
  getSingleCommitDays = () => {
    this.info.repos.forEach(repo => {
      const hashObject = {};
      repo.commitMostDay = {
        date: '',
        count: 0,
      };
      repo.commitTime.forEach(time => {
        const key = new Date(time).toDateString();
        if (key in hashObject) {
          hashObject[key]++;
        } else {
          hashObject[key] = 1;
        }
        if (hashObject[key] > repo.commitMostDay.count) {
          repo.commitMostDay.count = hashObject[key];
          repo.commitMostDay.date = new Date(time);
        }
      });
      repo.sumDays = Object.keys(hashObject).length;
    });
  };

  // 分析每个仓库提交最晚的时间
  getSingleLatestTime = () => {
    // 23:00 - 4:00 睡得较晚
    const late = [23, 0, 1, 2, 3];
    this.info.repos.forEach(repo => {
      repo.latestTime = '';
      repo.commitTime.forEach(time => {
        // 在这几个时间段内
        const current = new Date(time);
        if (late.includes(current.getHours())) {
          if (repo.latestTime === '') {
            repo.latestTime = new Date(time);
          } else {
            repo.latestTime = this.compareLate(repo.latestTime, current);
          }
        }
      });
    });
  };

  // 只有23:00 - 4:00的时间可以进入，保证不为空
  compareLate = (latest, current) => {
    // 分别比较时分秒
    const currentHours = current.getHours() === 23 ? -1 : current.getHours();
    const latestHours = latest.getHours() === 23 ? -1 : latest.getHours();
    if (currentHours > latestHours) {
      return current;
    } else if (currentHours === latestHours) {
      const currentMinutes = current.getMinutes();
      const latestMinutes = latest.getMinutes();
      if (currentMinutes > latestMinutes) {
        return current;
      } else if (currentMinutes === latestMinutes) {
        const currentSeconds = current.getSeconds();
        const latestSeconds = latest.getSeconds();
        if (currentSeconds > latestSeconds) {
          return current;
        }
      }
    }
    return latest;
  };

  fetchInfo = async () => {
    const promiseArr = [];
    // 获取用户名和头像
    const userInfo = await this.octokit.users.getAuthenticated();
    if (userInfo.status !== STATUS.OK) {
      this.setState({ failed: true });
      return;
    }
    this.info.username = userInfo.data.login;
    this.info.avatar = userInfo.data.avatar_url;

    // 获取issue数量
    promiseArr.push(this.fetchIssues());

    // 获取star数量
    promiseArr.push(this.fetchStars());

    // 分页，取出当前用户的满足条件的仓库
    this.info.repos = [];
    let repos;
    let repoPage = 1;
    let repoOver = false;
    do {
      repos = await this.octokit.repos.list({ visibility: 'all', sort: 'pushed', per_page: this.per_page, page: repoPage });
      if (repos.status !== STATUS.OK) {
        this.setState({ failed: true });
        return;
      }
      // 遍历所有仓库
      for (const repo of repos.data) {
        const created_at = new Date(repo.created_at);
        const pushed_at = new Date(repo.pushed_at);
        // 仓库最新push时间小于2018年，因为最新push时间降序排列，所以后序仓库不需遍历
        if (pushed_at.getTime() <= this.y2018.getTime()) {
          repoOver = true;
          break;
        }
        // 仓库创建时间大于2019年，跳过遍历下一个仓库
        if (created_at.getTime() >= this.y2019.getTime()) {
          continue;
        }
        // 仓库创建时间小于2019年 且 仓库最新push时间大于2018年，则该仓库有可能存在2018年的提交记录
        if (created_at.getTime() < this.y2019.getTime() && pushed_at.getTime() > this.y2018.getTime()) {
          // 不阻塞，继续下一个仓库，保存Promise
          promiseArr.push(this.fetchCommits(repo));
        }
      }
      repoPage++;
    } while (repos.data.length === this.per_page && !repoOver);
    return promiseArr;
  };

  // 获取issue数量
  fetchIssues = async () => {
    let issues;
    let issuePage = 1;
    this.info.issueNums = 0;
    do {
      issues = await this.octokit.issues.list({ filter: 'all', per_page: this.per_page, page: issuePage });
      if (issues.status !== STATUS.OK) {
        this.setState({ failed: true });
        return;
      }
      this.info.issueNums += issues.data.length;
      issuePage++;
    } while (issues.data.length === this.per_page);
  };

  // 获取star数量
  fetchStars = async () => {
    let stars;
    let starPage = 1;
    this.info.starNums = 0;
    do {
      stars = await this.octokit.activity.listReposStarredByAuthenticatedUser({ per_page: this.per_page, page: starPage });
      if (stars.status !== STATUS.OK) {
        this.setState({ failed: true });
        return;
      }
      this.info.starNums += stars.data.length;
      starPage++;
    } while (stars.data.length === this.per_page);
  };

  // 获取提交记录，同步函数
  fetchCommits = async repo => {
    const currentRepo = {
      repo: repo.name,
      owner: repo.owner.login,
      language: repo.language,
      commitTime: [],
    };
    let commits;
    let commitPage = 1;
    let commitOver = false;
    // 分页，取出当前仓库2018-2019年的全部提交
    do {
      commits = await this.octokit.repos.listCommits({
        owner: repo.owner.login,
        repo: repo.name,
        per_page: this.per_page,
        page: commitPage,
        since: this.y2018.toISOString(),
        until: this.y2019.toISOString(),
      });
      if (commits.status !== STATUS.OK) {
        this.setState({ failed: true });
        return;
      }
      for (const commit of commits.data) {
        const currentDate = new Date(commit.commit.committer.date);
        // 提交时间小于2018年，因为提交时间降序排列，所以后序提交不需遍历
        if (currentDate.getTime() <= this.y2018.getTime()) {
          commitOver = true;
          break;
        }
        // 提交时间大于2019年，跳过遍历下一次提交
        if (currentDate.getTime() >= this.y2019.getTime()) {
          continue;
        }
        // 提交人和当前用户一致 且 提交时间在2018——2019年之间，则放入提交时间
        if (
          (commit.committer && commit.committer.login === this.info.username) ||
          (commit.commit.committer && commit.commit.committer.name === this.info.username)
        ) {
          currentRepo.commitTime.push(commit.commit.committer.date);
        }
      }
      // console.log(commits.data);
      commitPage++;
    } while (commits.data.length === this.per_page && !commitOver);
    // 2018年存在提交记录则将该仓库加入
    if (currentRepo.commitTime.length > 0) {
      this.info.repos.push(currentRepo);
    }
  };

  setToken = () => {
    const query = queryParse();
    if (query.code) {
      const code = query.code;
      axiosJSON
        .post(PROXY, {
          code,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        })
        .then(res => {
          if (res.data && res.data.access_token) {
            const accessToken = res.data.access_token;
            localStorage.setItem(ACCESS_TOKEN, accessToken);
            window.location.href = `/`;
          } else {
            // no access_token
            console.log('res.data err:', res.data);
          }
        })
        .catch(err => {
          console.log('err: ', err);
        });
    }
  };

  authenticate = () => {
    this.octokit.authenticate({
      type: 'oauth',
      token: this.token,
    });
  };

  login = () => {
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo`;
  };

  onClose = () => {
    this.setState({ failed: false });
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          {this.state.failed ? (
            <Alert message="获取你的GitHub年终总结失败，请刷新重试" type="error" closable afterClose={this.onClose} />
          ) : null}
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <button onClick={this.login}>login</button>
        </header>
      </div>
    );
  }
}

export default App;
