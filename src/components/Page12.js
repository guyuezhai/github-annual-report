import React, { Component } from 'react';
import { fadeInUp } from 'react-animations';
import Radium, { StyleRoot } from 'radium';
import './Slide.css';
import Button from 'antd/lib/button';
import Alert from 'antd/lib/alert';
import Modal from 'antd/lib/modal';
import { OWNER, REPO, USERNAME, WECHAT } from '../utils/constant';
import { queryParse } from '../utils/helper';

class Page1 extends Component {
  constructor(props) {
    super(props);

    this.state = {
      failed: false,
      saveSuccess: false,
    };
    this.issueNum = 1;
    const query = queryParse();
    if (localStorage.getItem(USERNAME) === query.username) {
      this.state.isSelf = true;
    } else {
      this.state.isSelf = false;
    }
  }

  showSaveSuccess = () => {
    this.setState({
      saveSuccess: true,
    });
  };

  handleShare = () => {
    const confirm = Modal.confirm;
    confirm({
      title: '确认分享你的2019么？',
      content: '确定后信息将公开在GitHub中，可再使用当前软件的分享功能进行分享',
      cancelText: '取消',
      okText: '确定',
      onOk: async () => {
        return this.props.octokit.issues
          .createComment({ owner: OWNER, repo: REPO, number: this.issueNum, body: JSON.stringify(this.props.info) })
          .then(() => {
            console.log('success');
            this.showSaveSuccess();
          })
          .catch(() => {
            this.setState({ failed: true });
          });
      },
      onCancel() {},
    });
  };

  handleUnsubscribe = () => {
    window.location.href = 'https://github.com/guanpengchn/github-annual-report/issues/1';
  };

  handleBack = () => {
    window.location.href = '/';
  };

  handleCalc = () => {
    window.location.href = '/?isUpdate=true';
  };

  render() {
    const styles = {
      fadeInUp1s: {
        animation: 'x 1s',
        animationName: Radium.keyframes(fadeInUp, 'fadeInUp'),
      },
      fadeInUp1_5s: {
        animation: 'x 1.5s',
        animationName: Radium.keyframes(fadeInUp, 'fadeInUp'),
      },
      fadeInUp2s: {
        animation: 'x 2s',
        animationName: Radium.keyframes(fadeInUp, 'fadeInUp'),
      },
      fadeInUp2_5s: {
        animation: 'x 2.5s',
        animationName: Radium.keyframes(fadeInUp, 'fadeInUp'),
      },
      fadeInUp3s: {
        animation: 'x 3s',
        animationName: Radium.keyframes(fadeInUp, 'fadeInUp'),
      },
    };
    return (
      <StyleRoot>
        {this.props.page === 12 ? (
          <div className="page">
            {this.state.failed ? (
              <Alert message="获取你的GitHub年终总结失败，请刷新重试" type="error" closable afterClose={this.onClose} />
            ) : null}
            {this.state.saveSuccess ? (
              <Alert
                className="saveSuccess"
                message="数据存储成功"
                description="可使用当前软件的分享功能进行分享，记得“取消邮件提醒”，点击下方按钮进入Issue界面后，滑到最下方点击Unsubscribe"
                type="success"
                banner
                closable
                showIcon
              />
            ) : null}
            <p style={styles.fadeInUp1s} className="mb5">
              <strong>右上角分享到朋友圈</strong>
            </p>
            <p style={styles.fadeInUp1s} className="mb5">
              欢迎关注公众号：<strong>牧码啦</strong>
            </p>
            <p style={styles.fadeInUp1s} className="mb5">
              回复「<strong>报告</strong>」查看详细解释
            </p>
            <a
              style={styles.fadeInUp1s}
              className="mb5"
              href="https://github.com/guanpengchn/github-annual-report"
            >
              GitHub 地址，欢迎 Star
            </a>
            <p style={styles.fadeInUp1s} className="mb5" />
            <img className="mb20" alt="图片未加载成功" src={WECHAT} />
            <a
              style={styles.fadeInUp1s}
              className="mb20"
              href="https://mp.weixin.qq.com/mp/homepage?__biz=MzU5MTcyOTQ5OA==&hid=2&sn=09be71572089b12ef449524eb7aa858a"
            >
              作者的精选文章
            </a>
            {this.state.isSelf ? (
              <Button className="mb5" type="primary" onClick={this.handleCalc}>
                报告不准想重新计算
              </Button>
            ) : (
              <Button className="mb5" type="primary" onClick={this.handleBack}>
                获取你自己的报告
              </Button>
            )}
          </div>
        ) : null}
      </StyleRoot>
    );
  }
}

export default Page1;
