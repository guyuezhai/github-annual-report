## 简介

GitHub annual report 是利用 OAuth 认证，通过 GitHub API 调用，获取用户2018年的仓库和提交情况，进行进一步的分析，得出 GitHub 年度代码报告，所有代码均部署在 GitHub Page 上，无安全风险，欢迎来领取你的 [GitHub 2018年度代码报告](https://githubreport.github.io/)。

## 说明

- 由于项目是纯前端代码，所以数据存储设计在了GitHub Issue中，这是份儿公开的数据库
- 对项目有其他问题请发起新的Issue，**不要在数据库Issue中评论或者@他人**
- 存储数据后才可在其他软件中（如微信）分享链接
- 存储数据后请去数据库Issue中点击**右下方（或下方）的Unsubscribe按钮**，以防邮件提醒
- Issue中可以随时删除评论数据，否则其他人无法找到你的数据
- 只统计公开仓库，不会存在数据安全问题

## 主要依赖

- [create-react-app](https://github.com/facebook/create-react-app)
- [ant-design](https://github.com/ant-design/ant-design)
- [rest.js](https://github.com/octokit/rest.js)
- [axios](https://github.com/axios/axios)
- [react-id-swiper](https://github.com/kidjp85/react-id-swiper)
- [react-animations](https://github.com/FormidableLabs/react-animations)
- [typed.js](https://github.com/mattboldt/typed.js)

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
  },

  ...

]
```

```js
// analysisInfo
this.info = {
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

## 欢迎关注

![](https://github.com/guanpengchn/Figure/raw/master/wechat.jpg)