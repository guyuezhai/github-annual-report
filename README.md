## 简介

GitHub annual report 是利用 OAuth 认证，通过 GitHub API 调用，获取用户2018年的仓库和提交情况，进行进一步的分析，得出 GitHub 年度代码报告，所有代码均部署在 GitHub Page 上，无安全风险，欢迎来领取你的 [GitHub 2018年度代码报告](https://githubreport.github.io/)，建议移动端观看。

## 说明

- 由于项目是纯前端代码，所以数据存储设计在了GitHub Issue中，这是份儿公开的数据库
- 对项目有其他问题请发起新的Issue，**不要在数据库Issue中评论或者@他人**
- **存储数据后才可在其他软件中（如微信）分享链接**，否则其他人无法找到你的数据
- 存储数据后请去数据库Issue中点击**右下方（或下方）的Unsubscribe按钮**，以防邮件提醒
- Issue中可以随时删除评论数据
- **代码开源，网站开放，数据库开放，只统计公开仓库，不会存在数据安全问题**
- 由于实时分析的瓶颈在于网络请求，**默认每个repo只分析master分支**
- 一个请求超过10秒将做超时失败处理

## 主要依赖

- [create-react-app](https://github.com/facebook/create-react-app)
- [ant-design](https://github.com/ant-design/ant-design)
- [rest.js](https://github.com/octokit/rest.js)
- [axios](https://github.com/axios/axios)
- [react-id-swiper](https://github.com/kidjp85/react-id-swiper)
- [react-animations](https://github.com/FormidableLabs/react-animations)
- [typed.js](https://github.com/mattboldt/typed.js)

## 词条解释

### 1.

使用了n种编程语言

> 特指仓库上显示的主要语言

通过GitHub向n个代码仓库的主分支

> 有提交的仓库，不限于自己的

提交了n次代码

> 以各种形式最终形成提交记录的都包括在内

活跃了n天的时间

> GitHub下方的热力图

### 2.

与此同时
在你的敲击下

增加了n行代码<br/>
删除了n行代码<br/>
总共有n行代码被修改

### 3.

n月n日<br/>
大概是很特别的一天<br/>
这一天里<br/>
你向n仓库提交了<br/>
n次代码

> 某个仓库某天你的提交次数最多

### 4.

n月n日<br/>
这一天你睡得很晚<br/>
n点n分你还在与代码为伴<br/>
那一刻<br/>
你向n仓库提交了代码

> 提交代码最晚的一天，晚的范围在23:00——4:00

### 5.

这一年<br/>
你有n天都向<br/>
n提交了代码<br/>
所有熟悉的项目中<br/>
你对它最专一

> 提交代码天数最多的项目

### 6.

你喜欢在n提交代码

> n包括清晨（6:00-12:00）、午后（12:00-18:00）、傍晚（18:00-24:00）、凌晨（0:00-6:00）

特别是m

> n包括繁忙的工作日、安静的周末

365天中<br/>
你有x个m提交了代码

> 工作日或周末的提交天数

### 7.

作为社区的一员<br/>
2018年<br/>
你参与了n个问题的讨论<br/>
收藏了n个仓库

> 问题讨论包括被指派，提问，被提及，参与等，收藏特指Star

### 8.

还记得<br/>
世界上最好的语言<br/>
n吗<br/>
你曾经很喜欢<br/>
但最近似乎把它遗忘了

> 所有你参与提交的项目的主语言之一，它最后一次提交时间最早

### 9.

你的年度语言是n<br/>
一年中<br/>
你向m个n仓库<br/>
提交了x次代码

> 参与提交的仓库最多的一个主语言

## 快速开始

推荐使用yarn

```bash
$ npm install -g yarn
$ yarn
$ yarn start // 启动服务
$ yarn build // 打包
$ yarn test // 测试
$ yarn deploy // 部署
```

## 整体设计

![](https://github.com/guanpengchn/Figure/raw/master/github-annual-report.png)

## 数据结构

```js
// localStorage
ACCESS_TOKEN = '452df45345dsfg46'
USERNAME = 'test'
AVATAR = 'http://test.com/test.jpg'
OTHER = 'test2'
INFO = JSON.stringify(this.info)
```

```js
// fetchInfo
this.repos = [
  {
    repo: 'test',
    owner: 'Jim',
    language: 'Java',
    commitTime: [
      '2018-03-05T01:29:00Z',
      '2018-03-05T08:50:00Z',
      '2018-03-05T10:50:00Z',
      '2018-03-08T10:30:00Z',
      '2018-03-09T23:30:00Z',
      '2018-03-10T14:30:00Z'
    ],
    commitSha: [
      '6dcb09b5b57875f334f61aebed695e2e4193db5e',
      '7dcb09b5b57875f334f61aebed695e2e4193db5e',
      '8dcb09b5b57875f334f61aebed695e2e4193db5e',
      '9dcb09b5b57875f334f61aebed695e2e4193db5e',
      '0dcb09b5b57875f334f61aebed695e2e4193db5e',
      '1dcb09b5b57875f334f61aebed695e2e4193db5e',
    ],
    // analysisSingle
    commitMostDay: {
      date: '2018-03-05T01:29:00Z',
      count: 3
    },
    latestTime: '2018-03-05T01:29:00Z', //可能为空
    sumDays: 8,
    morningNums: 3,
    afternoonNums: 1,
    eveningNums: 2,
    dawnNums: 2,
    addLines: 2001,
    deleteLines: 2001,
    totalLines: 4002,
  },

  ...

]
```

```js
// analysisInfo
this.info = {
  eventNums: 244,
  addLines: 20010,
  deleteLines: 20010,
  totalLines: 40020,
  likeWeekType: {
    name: '周末',
    count: 52
  },
  weekendNums: 52,
  weekdayNums: 31,
  issueNums: 234, // 包括创建，指派，提及和订阅的问题
  starNums: 56, // 创建star的数量
  forget: {
    language: 'PHP',
    date: '2018-01-01T11:22:00Z'
  },
  languageLastCommit: {
    'Java': '2018-03-05T01:29:00Z',
    'PHP': '2018-01-01T11:22:00Z',

    ...

  },
  likePeriod: {
    name: 'afternoon',
    count: 30
  },
  period: {
    morningNums: 15,
    afternoonNums: 30,
    eveningNums: 16,
    dawnNums: 5
  },
  mostDay: {
    count: 6,
    repo: 'test'
  },
  latestDay: {
    date: '2018-03-05T01:29',
    repo: 'test'
  },
  specialDay: {
    date: '2018-03-05T01:29:00Z',
    repo: 'test',
    count: 3
  },
  commitNums: 231,
  repoNums: 20,
  languageNums: 8,
  mostLanguage: {
    name: 'JavaScript',
    repoNums: 3,
    commitNums: 65
  },
  language: {
    Java: 2,
    JavaScript: 3,

    ...

  }
}
```

## 欢迎关注公众号：牧码咯

更多有趣的编程信息等待你

![](https://github.com/guanpengchn/Figure/raw/master/wechat.jpg)