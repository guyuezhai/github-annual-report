import React, { Component } from 'react';
import './Slide.css';

import Swiper from 'react-id-swiper';
import wechat from '../images/wechat.jpg';
import Modal from 'antd/lib/modal';
import Button from 'antd/lib/button';
import Alert from 'antd/lib/alert';
import { OWNER, REPO, AVATAR, USERNAME } from '../utils/constant';
import bg from '../images/bg.png';

class Slide extends Component {
  constructor(props) {
    super(props);

    this.state = {
      failed: false,
      saveSuccess: false,
    };
    this.issueNum = 1;
  }

  showSaveSuccess = () => {
    this.setState({
      saveSuccess: true,
    });
  };

  handleShare = () => {
    const confirm = Modal.confirm;
    confirm({
      title: '确认分享你的2018么？',
      content: '确定后信息将公开在GitHub中，可再使用当前软件的分享功能进行分享',
      cancelText: '取消',
      okText: '确定',
      onOk: async () => {
        return this.props.octokit.issues
          .createComment({ owner: OWNER, repo: REPO, number: this.issueNum, body: JSON.stringify(this.props.collectInfo) })
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

  render() {
    const params = {
      height: document.body.clientHeight,
      autoHeight: true,
      direction: 'vertical',
      mousewheel: true,
      slidesPerView: 1
    };
    const sectionStyle = {
      backgroundImage: `url(${bg})`
    }
    return (
      <div className="Slide">
        <Swiper {...params}>
          <section style={ sectionStyle }>
            <p className="mb5">Hello, {localStorage.getItem(USERNAME)}</p>
            <img className="mb5 avatar" alt="图片未获取" src={localStorage.getItem(AVATAR)}/>
            <p>进入2018年</p>
          </section>
          <section style={ sectionStyle }>
            <p>这一年里</p>
            <p>你一共</p>
            {this.props.collectInfo.languageNums !== 0 ? (
              <p>
                使用了
                <span className="stress">{this.props.collectInfo.languageNums}</span>
                种编程语言
              </p>
            ) : (
              <p>敲击了很多文本</p>
            )}
            {this.props.collectInfo.repoNums !== 0 ? (
              <p>
                通过GitHub向
                <span className="stress">{this.props.collectInfo.repoNums}</span>
                个代码仓库
              </p>
            ) : (
              <p>在本地通过多个代码仓库</p>
            )}
            {this.props.collectInfo.commitNums !== 0 ? (
              <p>
                提交了
                <span className="stress">{this.props.collectInfo.commitNums}</span>
                次代码
              </p>
            ) : (
              <p>提交了多次代码</p>
            )}
          </section>

          {this.props.collectInfo.specialDay.date !== '' ? (
            <section style={ sectionStyle }>
              <p className="stress">
                {this.props.collectInfo.specialDay.date.getMonth() + 1}月{this.props.collectInfo.specialDay.date.getDate()}日
              </p>
              <p>大概是很特别的一天</p>
              <p>这一天里</p>
              <p>
                你向
                <span className="stress">{this.props.collectInfo.specialDay.repo}</span>
                仓库提交了
              </p>
              <p>
                <span className="stress">{this.props.collectInfo.specialDay.count}</span>
                次代码
              </p>
            </section>
          ) : (
            <section style={ sectionStyle }>
              <p>你没有什么特别的一天</p>
              <p>你的每天都一样精彩</p>
            </section>
          )}
          {this.props.collectInfo.latestDay.date !== '' ? (
            <section style={ sectionStyle }>
              <p className="stress">
                {this.props.collectInfo.latestDay.date.getMonth() + 1}月{this.props.collectInfo.latestDay.date.getDate()}日
              </p>
              <p>这一天你睡得很晚</p>
              <p>
                <span className="stress">
                  {this.props.collectInfo.latestDay.date.getHours()}点{this.props.collectInfo.latestDay.date.getMinutes()}分
                </span>
                你还在与代码为伴
              </p>
              <p>
                那一刻你向
                <span className="stress">{this.props.collectInfo.latestDay.repo}</span>
                仓库提交了代码
              </p>
            </section>
          ) : (
            <section style={ sectionStyle }>
              <p>每一天</p>
              <p>你休息得都很好</p>
              <p>早早地完成了代码提交工作</p>
            </section>
          )}
          {this.props.collectInfo.mostDay.repo !== '' ? (
            <section style={ sectionStyle }>
              <p>这一年</p>
              <p>
                你有
                <span className="stress">{this.props.collectInfo.mostDay.count}</span>
                天都向
              </p>
              <p>
                <span className="stress">{this.props.collectInfo.mostDay.repo}</span>
                提交了代码
              </p>
              <p>所有熟悉的项目中</p>
              <p>你对它最专一</p>
            </section>
          ) : (
            <section style={ sectionStyle }>
              <p>这一年</p>
              <p>你没有很心仪的项目</p>
              <p>大概在项目管理上</p>
              <p>有了不少提高</p>
            </section>
          )}
          {this.props.collectInfo.likePeriod.name !== '' ? (
            <section style={ sectionStyle }>
              <p>
                你喜欢在<span className="stress">{this.props.collectInfo.likePeriod.name}</span>提交代码
              </p>
              <p>
                特别是
                {this.props.collectInfo.likeWeekType.name === '工作日' ? '繁忙的' : '安静的'}
                <span className="stress">{this.props.collectInfo.likeWeekType.name}</span>
              </p>
              <p>一年中</p>
              <p>
                你有<span className="stress">{this.props.collectInfo.likeWeekType.count}</span>天{this.props.collectInfo.likeWeekType.name}
                提交了代码
              </p>
            </section>
          ) : (
            <section style={ sectionStyle }>
              <p>你没有固定的提交代码时间段</p>
              <p>无论是繁忙的工作日</p>
              <p>还安静的是周末</p>
            </section>
          )}

          <section style={ sectionStyle }>
            <p>作为社区的一员</p>
            <p>一年里</p>
            {this.props.collectInfo.issueNums !== 0 ? (
              <p>
                你参与了<span className="stress">{this.props.collectInfo.issueNums}</span>个问题的讨论
              </p>
            ) : (
              <p>你暗中观察，没有参与到讨论中</p>
            )}
            {this.props.collectInfo.starNums !== 0 ? (
              <p>
                收藏了<span className="stress">{this.props.collectInfo.starNums}</span>个仓库
              </p>
            ) : (
              <p>没发现值得你收藏的仓库</p>
            )}
          </section>

          {this.props.collectInfo.forget.language !== '' ? (
            <section style={ sectionStyle }>
              <p>还记得</p>
              <p>世界上最好的语言</p>
              <p>
                <span className="stress">{this.props.collectInfo.forget.language}</span>吗
              </p>
              <p>你曾经很喜欢</p>
              <p>但最近似乎把它遗忘了</p>
            </section>
          ) : (
            <section style={ sectionStyle }>
              <p>世界上最好的语言</p>
              <p>引起了无数硝烟</p>
              <p>但你岿然不动</p>
            </section>
          )}
          {this.props.collectInfo.mostLanguage.name !== '' ? (
            <section style={ sectionStyle }>
              <p>
                你的年度语言是<span className="stress">{this.props.collectInfo.mostLanguage.name}</span>
              </p>
              <p>一年中</p>
              <p>
                你向<span className="stress">{this.props.collectInfo.mostLanguage.repoNums}</span>个
                {this.props.collectInfo.mostLanguage.name}
                仓库
              </p>
              <p>
                提交了<span className="stress">{this.props.collectInfo.mostLanguage.commitNums}</span>次代码
              </p>
            </section>
          ) : (
            <section style={ sectionStyle }>
              <p>本年度</p>
              <p>所有的编程语言</p>
              <p>在你面前</p>
              <p>都已自惭形秽</p>
            </section>
          )}
          <section style={ sectionStyle }>
            {this.state.failed ? (
              <Alert message="获取你的GitHub年终总结失败，请刷新重试" type="error" closable afterClose={this.onClose} />
            ) : null}
            {this.state.saveSuccess ? (
              <Alert
                className="saveSuccess"
                message="数据存储成功"
                description="可使用当前软件的分享功能进行分享，记得进入项目页面，点击下方的Unsubscribe按钮，以防邮件提醒"
                type="success"
                banner
                closable
                showIcon
              />
            ) : null}
            <p className="mb5">
              欢迎关注项目：<a href="https://github.com/guanpengchn/github-annual-report/issues/1">github-annual-report</a>
            </p>
            <p className="mb5">欢迎关注公众号：牧码咯</p>
            <p className="mb5" />
            <img className="mb5" alt="图片未加载成功" src={wechat} />
            <Button type="primary" onClick={this.handleShare}>
              点击分享
            </Button>
          </section>
        </Swiper>
      </div>
    );
  }
}

export default Slide;
