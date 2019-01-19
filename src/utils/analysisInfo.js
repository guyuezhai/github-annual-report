import { compareLate } from './helper';

// 综合所有仓库做分析
const analysisInfo = (info, repos) => {
  getLanguage(info, repos);
  getRepoNums(info, repos);
  getCommitNums(info, repos);
  getSpecialDay(info, repos);
  getLatestDay(info, repos);
  getCommitDays(info, repos);
  getPeriod(info, repos);
  getForget(info, repos);
  getWeekDays(info, repos);
  getLines(info, repos);
};

// 分析工作日和休息日
const getWeekDays = (info, repos) => {
  const hashObject = {};
  info.weekdayNums = 0;
  info.weekendNums = 0;
  info.likeWeekType = {
    name: '',
    count: 0,
  };
  repos.forEach(repo => {
    repo.commitTime.forEach(time => {
      const key = new Date(time).toDateString();
      if (!(key in hashObject)) {
        hashObject[key] = true;
        if (new Date(time).getDay() === 6 || new Date(time).getDay() === 0) {
          info.weekendNums++;
        } else {
          info.weekdayNums++;
        }
      }
    });
  });
  if (info.weekendNums > info.weekdayNums) {
    info.likeWeekType.name = '周末';
    info.likeWeekType.count = info.weekendNums;
  } else {
    info.likeWeekType.name = '工作日';
    info.likeWeekType.count = info.weekdayNums;
  }
};

// 分析被遗忘的编程语言
const getForget = (info, repos) => {
  // 计算每种语言最后一次提交时间的hash
  info.languageLastCommit = {};
  const hashObject = info.languageLastCommit;
  repos.forEach(repo => {
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
  info.forget = {
    language: '',
    date: '',
  };
  const forget = info.forget;
  Object.keys(hashObject).forEach(key => {
    if (forget.date === '' || hashObject[key].getTime() < forget.date.getTime()) {
      forget.language = key;
      forget.date = hashObject[key];
    }
  });
};

// 分析所有的时间段提交情况，并选出提交最多的时间端
const getPeriod = (info, repos) => {
  info.period = {
    morningNums: 0,
    afternoonNums: 0,
    eveningNums: 0,
    dawnNums: 0,
  };
  const period = info.period;
  repos.forEach(repo => {
    period.morningNums += repo.morningNums;
    period.afternoonNums += repo.afternoonNums;
    period.eveningNums += repo.eveningNums;
    period.dawnNums += repo.dawnNums;
  });
  info.likePeriod = {
    name: '',
    count: 0,
  };
  const likePeriod = info.likePeriod;
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
const getCommitDays = (info, repos) => {
  info.mostDay = {
    count: 0,
    repo: '',
  };
  if (repos.length === 1) {
    const repo = repos[0];
    info.mostDay = {
      count: repo.sumDays,
      repo: repo.repo,
    };
  } else if (repos.length > 1) {
    const repo = repos.reduce((pre, cur) => (pre.sumDays > cur.sumDays ? pre : cur));
    info.mostDay = {
      count: repo.sumDays,
      repo: repo.repo,
    };
  }
};

// 分析提交代码最晚的一天
const getLatestDay = (info, repos) => {
  info.latestDay = {
    date: '',
    repo: '',
  };
  if (repos.length === 1) {
    const repo = repos[0];
    info.latestDay = {
      date: repo.latestTime,
      repo: repo.repo,
    };
  } else if (repos.length > 1) {
    const repo = repos.reduce((pre, cur) => {
      if (cur.latestTime === '') {
        return pre;
      }
      if (pre.latestTime === '') {
        return cur;
      }
      const date = compareLate(pre.latestTime, cur.latestTime);
      return pre.latestTime.getTime() === date.getTime() ? pre : cur;
    });
    info.latestDay = {
      date: repo.latestTime,
      repo: repo.repo,
    };
  }
};

// 分析对某个仓库提交次数特别多的一天，特殊的一天
const getSpecialDay = (info, repos) => {
  info.specialDay = {
    date: '',
    repo: '',
    count: 0,
  };
  if (repos.length === 1) {
    const repo = repos[0];
    info.specialDay = {
      date: repo.commitMostDay.date,
      repo: repo.repo,
      count: repo.commitMostDay.count,
    };
  } else if (repos.length > 1) {
    const repo = repos.reduce((pre, cur) => (pre.commitMostDay.count > cur.commitMostDay.count ? pre : cur));
    info.specialDay = {
      date: repo.commitMostDay.date,
      repo: repo.repo,
      count: repo.commitMostDay.count,
    };
  }
};

// 分析提交总次数
const getCommitNums = (info, repos) => {
  info.commitNums = 0;
  if (repos.length === 1) {
    info.commitNums = repos[0].commitTime.length;
  } else if (repos.length > 1) {
    info.commitNums = repos.reduce((pre, cur) =>
      typeof pre === 'number' ? pre + cur.commitTime.length : pre.commitTime.length + cur.commitTime.length
    );
  }
};

// 分析对多少仓库提交过代码
const getRepoNums = (info, repos) => {
  info.repoNums = repos.length;
};

// 分析编程语言数量，用的最多的年度编程语言
const getLanguage = (info, repos) => {
  // 计算年度编程语言
  info.mostLanguage = {
    name: '',
    repoNums: 0,
  };
  // 语言各有多少仓库
  info.language = {};
  const hashObject = info.language;
  repos.forEach(repo => {
    if (repo.language) {
      const key = repo.language;
      if (key in hashObject) {
        hashObject[key]++;
      } else {
        hashObject[key] = 1;
      }
      if (hashObject[key] > info.mostLanguage.repoNums) {
        info.mostLanguage.name = key;
        info.mostLanguage.repoNums = hashObject[key];
      }
    }
  });
  // 共用了多少种语言
  info.languageNums = Object.keys(hashObject).length;
  // 计算总提交数
  info.mostLanguage.commitNums = 0;
  repos.forEach(repo => {
    if (repo.language === info.mostLanguage.name) {
      info.mostLanguage.commitNums += repo.commitTime.length;
    }
  });
};

// 分析代码行数
const getLines = (info, repos) => {
  info.addLines = 0;
  info.deleteLines = 0;
  info.totalLines = 0;
  repos.forEach(repo => {
    info.addLines += repo.addLines;
    info.deleteLines += repo.deleteLines;
    info.totalLines += repo.totalLines;
  });
};

export default analysisInfo;
