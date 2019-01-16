import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
import { CLIENT_ID, CLIENT_SECRET, ACCESS_TOKEN, USERNAME, AVATAR, PROXY, STATUS, OWNER, REPO, OTHER } from './utils/constant';
import { queryParse, axiosJSON } from './utils/helper';
import Octokit from '@octokit/rest';
import Alert from 'antd/lib/alert';
import Button from 'antd/lib/button';
import Spin from 'antd/lib/spin';
import { ReactComponent as GitHub } from './icon/github.svg';
import Slide from './components/Slide';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      failed: false,
      loading: true,
      firstPage: true,
      viewOther: false,
      viewOtherNot: false,
    };
    this.octokit = new Octokit();
    this.info = {};
    this.collectInfo = {};
    this.y2018 = new Date('2018-01-01');
    this.y2019 = new Date('2019-01-01');
    this.per_page = 100;
    this.issueNum = 1;

    this.run();
  }

  run = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const query = queryParse();
    if (token) {
      // 存在username说明是自己或者别人想看
      if (query.username) {
        // 将Token交给Octokit
        this.authenticate();
        const isExisted = await this.fetchComments(query.username);
        // 如果GitHub上不存在数据
        if (!isExisted) {
          // 存在认证用户名 并且 认证用户名和查询用户名相同，则调用API获取数据
          if (localStorage.getItem(USERNAME) && localStorage.getItem(USERNAME) === query.username) {
            await this.calc();
            // console.log(this.info);
            console.log(this.collectInfo);
            this.setState({ loading: false, firstPage: false });
          }
          // 不一致则无法获取数据
          else {
            this.setState({ loading: false, viewOtherNot: true });
            localStorage.setItem(OTHER, '');
          }
        }
        // 如果存在数据
        else {
          this.setState({ loading: false, firstPage: false });
        }
      }
      // 存在code说明是在认证
      else if (query.code) {
        // localStorage保存了token
        await this.fetchToken(query.code);
        // 将Token交给Octokit
        this.authenticate();
        // localStorage保存了username和avatar
        await this.fetchUser();
        // 看其他人
        if (localStorage.getItem(OTHER)) {
          window.location.href = `/?username=${localStorage.getItem(OTHER)}`;
        }
        // 看自己
        else {
          window.location.href = `/?username=${localStorage.getItem(USERNAME)}`;
        }
      }
      // 根路径
      else {
        localStorage.setItem(OTHER, '');
        this.state.loading = false;
        window.location.href = `/?username=${localStorage.getItem(USERNAME)}`;
        return;
      }
    } else {
      // 存在username说明是在分享
      if (query.username) {
        this.state.loading = false;
        this.state.viewOther = true;
        localStorage.setItem(OTHER, query.username);
      }
      // 存在code说明是在认证
      else if (query.code) {
        // localStorage保存了token
        await this.fetchToken(query.code);
        // 将Token交给Octokit
        this.authenticate();
        // localStorage保存了username和avatar
        await this.fetchUser();
        // 看其他人
        if (localStorage.getItem(OTHER)) {
          window.location.href = `/?username=${localStorage.getItem(OTHER)}`;
        }
        // 看自己
        else {
          window.location.href = `/?username=${localStorage.getItem(USERNAME)}`;
        }
      }
      // 根路径
      else {
        localStorage.setItem(OTHER, '');
        this.state.loading = false;
      }
    }
  };

  // 判断GitHub上是否存在数据，username不为空
  fetchComments = async username => {
    let comments;
    let commentsExist = false;
    let commentsPage = 1;
    do {
      comments = await this.octokit.issues.listComments({
        owner: OWNER,
        repo: REPO,
        number: this.issueNum,
        per_page: this.per_page,
        page: commentsPage,
      });
      if (comments.status !== STATUS.OK) {
        this.setState({ failed: true });
        return;
      }
      for (const comment of comments.data) {
        if (comment.user.login === username) {
          try {
            this.collectInfo = JSON.parse(comment.body); //
          } catch (e) {
            this.setState({ failed: true });
          }
          this.collectInfo.specialDay.date = new Date(this.collectInfo.specialDay.date);
          this.collectInfo.latestDay.date = new Date(this.collectInfo.latestDay.date);
          commentsExist = true;
          break;
        }
      }
      commentsPage++;
    } while (comments.data.length === this.per_page && !commentsExist);
    return commentsExist;
  };

  calc = async () => {
    // 远程获取Issue Star repo commit信息
    const promiseArr = await this.fetchInfo();
    // 等待全部异步请求结束
    await Promise.all(promiseArr);
    this.analysisSingle();
    this.analysisCollect();
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
    this.getCollectWeekDays();
  };

  // 分析工作日和休息日
  getCollectWeekDays = () => {
    const hashObject = {};
    this.collectInfo.weekdayNums = 0;
    this.collectInfo.weekendNums = 0;
    this.collectInfo.likeWeekType = {
      name: '',
      count: 0,
    };
    this.info.repos.forEach(repo => {
      repo.commitTime.forEach(time => {
        const key = new Date(time).toDateString();
        if (!(key in hashObject)) {
          hashObject[key] = true;
          if (new Date(time).getDay() === 6 || new Date(time).getDay() === 0) {
            this.collectInfo.weekendNums++;
          } else {
            this.collectInfo.weekdayNums++;
          }
        }
      });
    });
    if (this.collectInfo.weekendNums > this.collectInfo.weekdayNums) {
      this.collectInfo.likeWeekType.name = '周末';
      this.collectInfo.likeWeekType.count = this.collectInfo.weekendNums;
    } else {
      this.collectInfo.likeWeekType.name = '工作日';
      this.collectInfo.likeWeekType.count = this.collectInfo.weekdayNums;
    }
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
      likePeriod.name = '清晨';
    } else if (likePeriod.name === 'afternoonNums') {
      likePeriod.name = '午后';
    } else if (likePeriod.name === 'eveningNums') {
      likePeriod.name = '傍晚';
    } else if (likePeriod.name === 'dawnNums') {
      likePeriod.name = '凌晨';
    }
  };

  // 分析所有仓库中提交天数最多的一个
  getCollectCommitDays = () => {
    this.collectInfo.mostDay = {
      count: 0,
      repo: '',
    };
    if (this.info.repos.length === 1) {
      const repo = this.info.repos[0];
      this.collectInfo.mostDay = {
        count: repo.sumDays,
        repo: repo.repo,
      };
    } else if (this.info.repos.length > 1) {
      const repo = this.info.repos.reduce((pre, cur) => (pre.sumDays > cur.sumDays ? pre : cur));
      this.collectInfo.mostDay = {
        count: repo.sumDays,
        repo: repo.repo,
      };
    }
  };

  // 分析提交代码最晚的一天
  getCollectLatestDay = () => {
    this.collectInfo.latestDay = {
      date: '',
      repo: '',
    };
    if (this.info.repos.length === 1) {
      const repo = this.info.repos[0];
      this.collectInfo.latestDay = {
        date: repo.latestTime,
        repo: repo.repo,
      };
    } else if (this.info.repos.length > 1) {
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
    }
  };

  // 分析对某个仓库提交次数特别多的一天，特殊的一天
  getCollectSpecialDay = () => {
    this.collectInfo.specialDay = {
      date: '',
      repo: '',
      count: 0,
    };
    if (this.info.repos.length === 1) {
      const repo = this.info.repos[0];
      this.collectInfo.specialDay = {
        date: repo.commitMostDay.date,
        repo: repo.repo,
        count: repo.commitMostDay.count,
      };
    } else if (this.info.repos.length > 1) {
      const repo = this.info.repos.reduce((pre, cur) => (pre.commitMostDay.count > cur.commitMostDay.count ? pre : cur));
      this.collectInfo.specialDay = {
        date: repo.commitMostDay.date,
        repo: repo.repo,
        count: repo.commitMostDay.count,
      };
    }
  };

  // 分析提交总次数
  getCollectCommitNums = () => {
    this.collectInfo.commitNums = 0;
    if (this.info.repos.length === 1) {
      this.collectInfo.commitNums = this.info.repos[0].commitTime.length;
    } else if (this.info.repos.length > 1) {
      this.collectInfo.commitNums = this.info.repos.reduce((pre, cur) =>
        typeof pre === 'number' ? pre + cur.commitTime.length : pre.commitTime.length + cur.commitTime.length
      );
    }
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

  fetchUser = async () => {
    // 获取用户名和头像
    const userInfo = await this.octokit.users.getAuthenticated();
    if (userInfo.status !== STATUS.OK) {
      this.setState({ failed: true });
      return;
    }
    localStorage.setItem(USERNAME, userInfo.data.login);
    localStorage.setItem(AVATAR, userInfo.data.avatar_url);
  };

  fetchInfo = async () => {
    const promiseArr = [];

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
    this.collectInfo.issueNums = 0;
    do {
      issues = await this.octokit.issues.list({ filter: 'all', per_page: this.per_page, page: issuePage });
      if (issues.status !== STATUS.OK) {
        this.setState({ failed: true });
        return;
      }
      this.collectInfo.issueNums += issues.data.length;
      issuePage++;
    } while (issues.data.length === this.per_page);
  };

  // 获取star数量
  fetchStars = async () => {
    let stars;
    let starPage = 1;
    this.collectInfo.starNums = 0;
    do {
      stars = await this.octokit.activity.listReposStarredByAuthenticatedUser({ per_page: this.per_page, page: starPage });
      if (stars.status !== STATUS.OK) {
        this.setState({ failed: true });
        return;
      }
      this.collectInfo.starNums += stars.data.length;
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
          (commit.committer && commit.committer.login === localStorage.getItem(USERNAME)) ||
          (commit.commit.committer && commit.commit.committer.name === localStorage.getItem(USERNAME))
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

  fetchToken = async code => {
    const res = await axiosJSON.post(PROXY, {
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });
    if (res.status !== STATUS.OK) {
      this.setState({ failed: true });
      return;
    }
    localStorage.setItem(ACCESS_TOKEN, res.data.access_token);
  };

  authenticate = () => {
    this.octokit.authenticate({
      type: 'oauth',
      token: localStorage.getItem(ACCESS_TOKEN),
    });
  };

  login = () => {
    this.setState({ loading: true });
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo`;
  };

  onClose = () => {
    this.setState({ failed: false });
  };

  render() {
    let firstPage = null;
    if (this.state.loading) {
      firstPage = <Spin size="large" />;
    } else if (this.state.viewOther) {
      firstPage = (
        <div className="header">
          <p>想看其他人2018年度GitHub代码报告么？请先登录</p>
          <Button className="login" type="primary" onClick={this.login}>
            <GitHub className="github" />
            登录
          </Button>
        </div>
      );
    } else if (this.state.viewOtherNot) {
      firstPage = (
        <div className="header">
          <p>他的报告不存在，欢迎邀请好友</p>
          <p>登陆查看自己的报告</p>
          <Button className="login" type="primary" onClick={this.login}>
            <GitHub className="github" />
            登录
          </Button>
        </div>
      );
    } else {
      firstPage = (
        <div className="header">
          <p>想看自己2018年度GitHub代码报告么？请先登录</p>
          <Button className="login" type="primary" onClick={this.login}>
            <GitHub className="github" />
            登录
          </Button>
        </div>
      );
    }
    return (
      <div className="App">
        {this.state.firstPage ? (
          <div className="firstPage">
            {this.state.failed ? (
              <Alert className="failed" message="获取你的GitHub年终总结失败，请刷新重试" type="error" closable afterClose={this.onClose} banner/>
            ) : null}
            {firstPage}
          </div>
        ) : (
          <Slide collectInfo={this.collectInfo} octokit={this.octokit} />
        )}
      </div>
    );
  }
}

export default App;
