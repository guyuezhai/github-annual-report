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
  OTHER,
  BG1,
  BG2,
  WECHAT,
  MUSIC,
} from './utils/constant';
import { queryParse, axiosJSON } from './utils/helper';
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
      viewOther: false,
      viewOtherNot: false,
      status: '正在读取数据...',
      requestNums: 0,
    };
    this.octokit = new Octokit();
    this.repos = {};
    this.info = {};
    this.y2018 = new Date('2018-01-01');
    this.y2019 = new Date('2019-01-01');
    this.per_page = 100;
    this.issueNum = 1;

    this.run();
  }

  // 权限和路由参数处理
  run = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const query = queryParse();
    this.fetchAssets();
    if (token) {
      // 存在username说明是自己或者别人想看
      if (query.username) {
        // 将Token交给Octokit
        this.authenticate();
        const isExisted = await this.fetchComments(query.username);
        // 如果GitHub上不存在数据
        if (!isExisted) {
          this.setState({ status: '缓存数据不存在' });
          // 存在认证用户名 并且 认证用户名和查询用户名相同，则调用API获取数据
          if (localStorage.getItem(USERNAME) && localStorage.getItem(USERNAME) === query.username) {
            await this.calc();
            // console.log(this.repos);
            console.log(this.info);
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
          this.setState({ status: '缓存读取成功' });
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

  // 获取用户信息和分析计算
  calc = async () => {
    // 远程获取Issue Star repo commit信息
    await this.fetchInfo();
    this.setState({ status: '正在分析每个仓库...' });
    analysisSingle(this.repos);
    this.setState({ status: '正在生成报告...' });
    analysisInfo(this.info, this.repos);
    this.setState({ status: '报告生成完毕！' });
  };

  fetchAssets = () => {
    // 获取三张图片和一个音乐
    this.fetchImage(BG1);
    this.fetchImage(BG2);
    this.fetchImage(WECHAT);
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
            this.info = JSON.parse(comment.body); //
          } catch (e) {
            this.setState({ failed: true });
          }
          this.info.specialDay.date = new Date(this.info.specialDay.date);
          this.info.latestDay.date = new Date(this.info.latestDay.date);
          commentsExist = true;
          break;
        }
      }
      commentsPage++;
    } while (comments.data.length === this.per_page && !commentsExist);
    return commentsExist;
  };

  fetchUser = async () => {
    this.setState({ status: '正在获取用户信息', requestNums: this.state.requestNums + 1 });
    // 获取用户名和头像
    const userInfo = await this.octokit.users.getAuthenticated();
    if (userInfo.status !== STATUS.OK) {
      this.setState({ failed: true });
      return;
    }
    localStorage.setItem(USERNAME, userInfo.data.login);
    localStorage.setItem(AVATAR, userInfo.data.avatar_url);
    this.setState({ status: '用户信息获取成功' });
  };

  // 包含fetchIssues, fetchStars, fetchRepos, fetchCommits
  fetchInfo = async () => {
    const promiseArr = [];
    // 获取issue数量
    promiseArr.push(this.fetchIssues());
    // 获取star数量
    promiseArr.push(this.fetchStars());
    // 获取repo信息
    promiseArr.push(this.fetchRepo(promiseArr));
    // 等待全部异步请求结束
    await Promise.all(promiseArr);
  };

  //  获取仓库信息
  fetchRepo = async promiseArr => {
    // 分页，取出当前用户的满足条件的仓库
    this.repos = [];
    let repos;
    let repoPage = 1;
    let repoOver = false;
    do {
      this.setState({ status: '正在获取仓库', requestNums: this.state.requestNums + 1 });
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
    this.setState({ status: '仓库获取成功' });
  };

  // 获取issue数量
  fetchIssues = async () => {
    let issues;
    let issuePage = 1;
    this.info.issueNums = 0;
    do {
      this.setState({ status: '正在获取Issue', requestNums: this.state.requestNums + 1 });
      issues = await this.octokit.issues.list({
        filter: 'all',
        state: 'all',
        since: this.y2018.toISOString(),
        per_page: this.per_page,
        page: issuePage,
      });
      if (issues.status !== STATUS.OK) {
        this.setState({ failed: true });
        return;
      }
      this.info.issueNums += issues.data.length;
      issuePage++;
    } while (issues.data.length === this.per_page);
    this.setState({ status: 'Issue获取成功' });
  };

  // 获取star数量
  fetchStars = async () => {
    let stars;
    let starPage = 1;
    this.info.starNums = 0;
    do {
      this.setState({ status: '正在获取Star', requestNums: this.state.requestNums + 1 });
      stars = await this.octokit.activity.listReposStarredByAuthenticatedUser({ sort: 'created', per_page: this.per_page, page: starPage });
      if (stars.status !== STATUS.OK) {
        this.setState({ failed: true });
        return;
      }
      this.info.starNums += stars.data.length;
      starPage++;
    } while (stars.data.length === this.per_page);
    this.setState({ status: 'Star获取成功' });
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
      this.setState({ status: `正在获取${repo.name}的Commit`, requestNums: this.state.requestNums + 1 });
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
      this.repos.push(currentRepo);
    }
    this.setState({ status: `${repo.name}的Commit获取成功` });
  };

  fetchToken = async code => {
    this.setState({ status: `正在获取Token`, requestNums: this.state.requestNums + 1 });
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
    } else if (this.state.viewOther) {
      firstPage = (
        <div className="header">
          <p>想看其他人2018年度GitHub代码报告么？</p>
          <p>请先登录</p>
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
          <p>想看自己2018年度GitHub代码报告么？</p>
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
