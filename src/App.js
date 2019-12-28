import React, { Component } from 'react';
import './App.css';
import {
  CLIENT_ID,
  CLIENT_SECRET,
  ACCESS_TOKEN,
  USERNAME,
  AVATAR,
  PROXY,
  STATUS,
  OWNER,
  REPO,
  BG1,
  BG2,
  WECHAT,
  MUSIC,
  QRCODE,
  TIPS1_TIME,
  TIPS2_TIME,
  PER_PAGE,
  ISSUE_NUM,
  YEAR_START,
  YEAR_END,
  SERVER,
} from './utils/constant';
import { queryParse, axiosJSON, timeout } from './utils/helper';
import Octokit from '@octokit/rest';
import Alert from 'antd/lib/alert';
import Button from 'antd/lib/button';
import Spin from 'antd/lib/spin';
import { ReactComponent as GitHub } from './icon/githubWhite.svg';
import Slide from './components/Slide';
import analysisSingle from './utils/analysisSingle';
import analysisInfo from './utils/analysisInfo';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      failed: false,
      loading: true,
      firstPage: true,
      status: '正在读取数据...',
      requestNums: 0,
      fineshedRequest: 0,
      failedRequest: 0,
    };
    this.octokit = new Octokit();
    this.repos = {};
    this.info = {};

    this.run();
  }

  componentDidMount() {
    this.timer1 = setInterval(() => this.tips1(), TIPS1_TIME);
    this.timer2 = setInterval(() => this.tips2(), TIPS2_TIME);
  }

  componentWillUnmount() {
    clearInterval(this.timer1);
    clearInterval(this.timer2);
  }

  tips1() {
    if (this.state.fineshedRequest === this.state.requestNums) {
      clearInterval(this.timer1);
      clearInterval(this.timer2);
    } else {
      this.setState({
        status: `请求完成比：${this.state.fineshedRequest}/${this.state.requestNums}，失败：${this.state.failedRequest}`,
      });
    }
  }

  tips2() {
    this.setState({
      status: `如长时间请求无变化，请刷新或更换浏览器`,
    });
  }

  // 权限和路由参数处理
  run = async () => {
    const query = queryParse();
    this.fetchAssets();
    // 本人想重新计算
    if (query.isUpdate) {
      this.authenticate();
      await this.calc();
      console.log(this.repos);
      console.log(this.info);
      this.setState({ loading: false, firstPage: false });
    }
    // 存在username说明是要看某个人的
    if (query.username) {
      const isExist = await this.getInfo(query.username);
      // 如果服务器上不存在数据
      if (!isExist) {
        this.setState({ status: '该用户数据不存在', fineshedRequest: this.state.fineshedRequest + 1 });
        // 存在认证用户名 并且 认证用户名和查询用户名相同，则调用API获取数据
        if (localStorage.getItem(USERNAME) && localStorage.getItem(USERNAME) === query.username) {
          this.authenticate();
          await this.calc();
          console.log(this.repos);
          console.log(this.info);
          this.setState({ loading: false, firstPage: false });
        }
        // 不一致则无法获取数据
        else {
          this.setState({ loading: false });
        }
      }
      // 如果存在数据
      else {
        this.setState({ status: '数据读取成功' });
        this.setState({ loading: false, firstPage: false });
      }
    } else {
      // 已经认证过
      if (localStorage.getItem(ACCESS_TOKEN) && localStorage.getItem(USERNAME)) {
        // 看自己
        window.location.href = `/?username=${localStorage.getItem(USERNAME)}`;
      }
      // 存在code说明是在认证
      else if (query.code) {
        // localStorage保存了token
        await this.fetchToken(query.code);
        // 将Token交给Octokit
        this.authenticate();
        // localStorage保存了username和avatar
        await this.fetchUser();
        window.location.href = `/?username=${localStorage.getItem(USERNAME)}`;
      }
      // 根路径
      else {
        this.state.loading = false;
      }
    }
  };

  // 获取用户信息和分析计算
  calc = async () => {
    // 远程获取Issue Star repo commit信息
    await this.fetchInfo();
    this.setState({ status: '正在分析每个仓库...' });
    analysisSingle(this.repos);
    this.setState({ status: '正在生成报告...' });
    analysisInfo(this.info, this.repos);
    // localStorage.setItem(INFO, JSON.stringify(this.info));
    const req = {
      username: localStorage.getItem(USERNAME),
      avatar: localStorage.getItem(AVATAR),
      info: JSON.stringify(this.info),
      repo: JSON.stringify(this.repos),
    };
    this.addInfo(req);
    this.setState({ status: '报告生成完毕！' });
  };

  fetchAssets = () => {
    // 获取三张图片和一个音乐
    this.fetchImage(BG1);
    this.fetchImage(BG2);
    this.fetchImage(WECHAT);
    this.fetchImage(QRCODE);
    this.fetchAudio(MUSIC);
  };

  fetchImage = url => {
    return new Promise(function(resolve, reject) {
      var img = new Image();
      img.src = url;
      img.onload = function() {
        resolve();
      };
      img.onerror = function() {
        reject();
      };
    });
  };

  fetchAudio = url => {
    return new Promise(function(resolve, reject) {
      var audio = new Audio();
      audio.src = url;
      audio.onload = function() {
        resolve();
      };
      audio.onerror = function() {
        reject();
      };
    });
  };

  // 判断GitHub上是否存在数据，username不为空
  fetchComments = async username => {
    let comments;
    let commentsExist = false;
    let commentsPage = 1;
    do {
      this.state.status = '正在读取缓存';
      this.state.requestNums = this.state.requestNums + 1;
      comments = await timeout(
        this.octokit.issues.listComments({
          owner: OWNER,
          repo: REPO,
          number: ISSUE_NUM,
          per_page: PER_PAGE,
          page: commentsPage,
        })
      );
      if (!comments || comments.status !== STATUS.OK) {
        this.setState({ failedRequest: this.state.failedRequest + 1 });
        return;
      }
      for (const comment of comments.data) {
        if (comment.user.login === username) {
          try {
            this.info = JSON.parse(comment.body); //
          } catch (e) {
            this.setState({ failed: true });
          }
          if (this.info && this.info.specialDay.date !== '') {
            this.info.specialDay.date = new Date(this.info.specialDay.date);
          }
          if (this.info && this.info.latestDay.date !== '') {
            this.info.latestDay.date = new Date(this.info.latestDay.date);
          }
          commentsExist = true;
          break;
        }
      }
      commentsPage++;
    } while (comments.data.length === PER_PAGE && !commentsExist);
    return commentsExist;
  };

  fetchUser = async () => {
    this.setState({ status: '正在获取用户信息', requestNums: this.state.requestNums + 1 });
    // 获取用户名和头像
    const userInfo = await timeout(this.octokit.users.getAuthenticated());
    if (!userInfo || userInfo.status !== STATUS.OK) {
      this.setState({ failedRequest: this.state.failedRequest + 1, status: '用户信息获取失败' });
      return;
    }
    localStorage.setItem(USERNAME, userInfo.data.login);
    localStorage.setItem(AVATAR, userInfo.data.avatar_url);
    this.setState({ status: '用户信息获取成功', fineshedRequest: this.state.fineshedRequest + 1 });
  };

  // 包含fetchIssues, fetchStars, fetchRepos, fetchCommits
  fetchInfo = async () => {
    const promiseArr = [];
    // 获取issue数量
    promiseArr.push(this.fetchIssues());
    // 获取star数量
    promiseArr.push(this.fetchStars());
    // 获取event数量
    promiseArr.push(this.fetchEvents());
    // 获取repo信息
    promiseArr.push(this.fetchRepo());
    // 等待全部异步请求结束
    await Promise.all(promiseArr);
  };

  fetchEvents = async () => {
    let events;
    let eventOver = false;
    let eventPage = 1;
    const hashObject = {};
    this.info.eventNums = 0;
    do {
      this.setState({ status: '正在获取Event', requestNums: this.state.requestNums + 1 });
      events = await timeout(
        this.octokit.activity.listPublicEventsForUser({
          username: localStorage.getItem(USERNAME),
          per_page: PER_PAGE,
          page: eventPage,
        })
      );
      if (!events || events.status !== STATUS.OK) {
        this.setState({ failedRequest: this.state.failedRequest + 1 });
        return;
      }
      // 遍历所有活动
      for (const event of events.data) {
        const created_at = new Date(event.created_at);
        // 活动时间小于2019年，因为降序排列，所以后序活动不需遍历
        if (created_at.getTime() <= YEAR_START.getTime()) {
          eventOver = true;
          break;
        }
        // 仓库创建时间大于2019年，跳过遍历下一个仓库
        if (created_at.getTime() >= YEAR_END.getTime()) {
          continue;
        }
        const key = created_at.getTime();
        if (key in hashObject) {
          continue;
        } else {
          hashObject[key] = true;
        }
      }
      this.info.eventNums += events.data.length;
      this.setState({ status: `第${eventPage}页Event获取成功`, fineshedRequest: this.state.fineshedRequest + 1 });
      eventPage++;
    } while (events.data.length === PER_PAGE && !eventOver);
    this.info.eventNums = Object.keys(hashObject).length;
    this.setState({ status: 'Event获取成功' });
  };

  //  获取仓库信息
  fetchRepo = async () => {
    const promiseArr = [];
    // 分页，取出当前用户的满足条件的仓库
    this.repos = [];
    let repos;
    let repoPage = 1;
    do {
      this.setState({ status: '正在获取仓库', requestNums: this.state.requestNums + 1 });
      repos = await timeout(this.octokit.activity.listWatchedReposForAuthenticatedUser({ per_page: PER_PAGE, page: repoPage }));
      if (!repos || repos.status !== STATUS.OK) {
        this.setState({ failedRequest: this.state.failedRequest + 1 });
        return;
      }
      // 遍历所有仓库
      for (const repo of repos.data) {
        const created_at = new Date(repo.created_at);
        const pushed_at = new Date(repo.pushed_at);
        // 仓库创建时间大于2019年，跳过遍历下一个仓库
        if (created_at.getTime() >= YEAR_END.getTime()) {
          continue;
        }
        // 仓库创建时间小于2019年 且 仓库最新push时间大于2019年，则该仓库有可能存在2019年的提交记录
        if (created_at.getTime() < YEAR_END.getTime() && pushed_at.getTime() > YEAR_START.getTime()) {
          // 不阻塞，继续下一个仓库，保存Promise
          promiseArr.push(this.fetchCommits(repo));
        }
      }
      this.setState({ status: `第${repoPage}页仓库获取成功`, fineshedRequest: this.state.fineshedRequest + 1 });
      repoPage++;
    } while (repos.data.length === PER_PAGE);
    // 等待全部异步请求结束
    await Promise.all(promiseArr);
    this.setState({ status: `仓库获取成功` });
  };

  // 获取issue数量
  fetchIssues = async () => {
    let issues;
    let issuePage = 1;
    this.info.issueNums = 0;
    do {
      this.setState({ status: '正在获取Issue', requestNums: this.state.requestNums + 1 });
      issues = await timeout(
        this.octokit.issues.list({
          filter: 'all',
          state: 'all',
          since: YEAR_START.toISOString(),
          per_page: PER_PAGE,
          page: issuePage,
        })
      );
      if (!issues || issues.status !== STATUS.OK) {
        this.setState({ failedRequest: this.state.failedRequest + 1 });
        return;
      }
      this.info.issueNums += issues.data.length;
      this.setState({ status: `第${issuePage}页Issue获取成功`, fineshedRequest: this.state.fineshedRequest + 1 });
      issuePage++;
    } while (issues.data.length === PER_PAGE);
    this.setState({ status: 'Issue获取成功' });
  };

  // 获取star数量
  fetchStars = async () => {
    let stars;
    let starPage = 1;
    this.info.starNums = 0;
    do {
      this.setState({ status: '正在获取Star', requestNums: this.state.requestNums + 1 });
      stars = await timeout(
        this.octokit.activity.listReposStarredByAuthenticatedUser({ sort: 'created', per_page: PER_PAGE, page: starPage })
      );
      if (!stars || stars.status !== STATUS.OK) {
        this.setState({ failedRequest: this.state.failedRequest + 1 });
        return;
      }
      this.info.starNums += stars.data.length;
      this.setState({ status: `第${starPage}页Star获取成功`, fineshedRequest: this.state.fineshedRequest + 1 });
      starPage++;
    } while (stars.data.length === PER_PAGE);
    this.setState({ status: 'Star获取成功' });
  };

  // 获取提交记录
  fetchCommits = async repo => {
    const currentRepo = {
      repo: repo.name,
      owner: repo.owner.login,
      language: repo.language,
      commitTime: [],
      commitSha: [],
      addLines: 0,
      deleteLines: 0,
      totalLines: 0,
    };
    let commits;
    let commitPage = 1;
    let commitOver = false;
    // 分页，取出当前仓库2019-2020年的全部提交
    do {
      this.setState({ status: `正在获取${repo.name}的Commit`, requestNums: this.state.requestNums + 1 });
      commits = await timeout(
        this.octokit.repos.listCommits({
          owner: repo.owner.login,
          repo: repo.name,
          author: localStorage.getItem(USERNAME),
          per_page: PER_PAGE,
          page: commitPage,
          since: YEAR_START.toISOString(),
          until: YEAR_END.toISOString(),
        })
      );
      if (!commits || commits.status !== STATUS.OK) {
        this.setState({ failedRequest: this.state.failedRequest + 1 });
        return;
      }
      for (const commit of commits.data) {
        const currentDate = new Date(commit.commit.committer.date);
        // 提交时间小于2019年，因为提交时间降序排列，所以后序提交不需遍历
        if (currentDate.getTime() <= YEAR_START.getTime()) {
          commitOver = true;
          break;
        }
        // 提交时间大于2019年，跳过遍历下一次提交
        if (currentDate.getTime() >= YEAR_END.getTime()) {
          continue;
        }
        // 提交人和当前用户一致 且 提交时间在2019——2020年之间，则放入提交时间
        if (
          (commit.committer && commit.committer.login === localStorage.getItem(USERNAME)) ||
          (commit.commit.committer && commit.commit.committer.name === localStorage.getItem(USERNAME))
        ) {
          currentRepo.commitTime.push(commit.commit.committer.date);
          currentRepo.commitSha.push(commit.sha);
          // 获取单个commit信息
          await this.fetchSingleCommit(currentRepo, repo.name, repo.owner.login, commit.sha);
        }
      }
      this.setState({ status: `${repo.name}的第${commitPage}页Commit获取成功`, fineshedRequest: this.state.fineshedRequest + 1 });
      commitPage++;
    } while (commits.data.length === PER_PAGE && !commitOver);
    // 2019年存在提交记录则将该仓库加入
    if (currentRepo.commitTime.length > 0) {
      this.repos.push(currentRepo);
    }
    this.setState({ status: `${repo.name}的Commit获取成功` });
  };

  // 获取单个提交记录
  fetchSingleCommit = async (currentRepo, repo, owner, sha) => {
    this.setState({ requestNums: this.state.requestNums + 1 });
    const commit = await timeout(this.octokit.repos.getCommit({ owner, repo, sha }));
    if (!commit || commit.status !== STATUS.OK) {
      this.setState({ failedRequest: this.state.failedRequest + 1 });
      return;
    }
    currentRepo.addLines += commit.data.stats.additions;
    currentRepo.deleteLines += commit.data.stats.deletions;
    currentRepo.totalLines += commit.data.stats.additions + commit.data.stats.deletions;
    this.setState({ status: `${repo}的提交${commit.data.sha.substr(0, 6)}获取成功`, fineshedRequest: this.state.fineshedRequest + 1 });
  };

  fetchToken = async code => {
    this.state.status = `正在获取Token`;
    this.state.requestNums = this.state.requestNums + 1;
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
    this.setState({ status: `Token获取成功` });
  };

  authenticate = () => {
    this.octokit.authenticate({
      type: 'oauth',
      token: localStorage.getItem(ACCESS_TOKEN),
    });
  };

  login = () => {
    this.setState({ loading: true });
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=public_repo`;
  };

  onClose = () => {
    this.setState({ failed: false });
  };

  getInfo = async username => {
    let isExist = false;
    const res = await axiosJSON.get(SERVER + '/users/' + username);
    const { data } = res.data;
    if (data && data.username === username) {
      try {
        this.info = JSON.parse(data.info); //
      } catch (e) {
        this.setState({ failed: true });
      }
      if (this.info.specialDay.date !== '') {
        this.info.specialDay.date = new Date(this.info.specialDay.date);
      }
      if (this.info.latestDay.date !== '') {
        this.info.latestDay.date = new Date(this.info.latestDay.date);
      }
      isExist = true;
    }
    return isExist;
  };

  addInfo = async info => {
    const res = await axiosJSON.post(SERVER + '/users', info);
    if (res) {
      this.setState({ status: '报告存储完毕！' });
    }
  };

  render() {
    let firstPage = null;
    const styles = {
      firstPage: {
        backgroundImage: `url(http://githubreport.oss-cn-beijing.aliyuncs.com/bg1.jpg)`,
        backgroundSize: '100%',
      },
    };
    if (this.state.loading) {
      firstPage = <Spin className="spin" size="large" tip={this.state.status} />;
    } else {
      firstPage = (
        <div className="header">
          <p>想看自己2019年度GitHub代码报告么？</p>
          <p>请先登录</p>
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
          <div className="firstPage" style={styles.firstPage}>
            {this.state.failed ? (
              <Alert
                className="failed"
                message="获取你的GitHub年终总结失败，请刷新重试"
                type="error"
                closable
                afterClose={this.onClose}
                banner
              />
            ) : null}
            {firstPage}
          </div>
        ) : (
          <Slide info={this.info} octokit={this.octokit} />
        )}
      </div>
    );
  }
}

export default App;
