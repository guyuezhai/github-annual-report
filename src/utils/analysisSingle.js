import { compareLate } from './helper';

// 对每个仓库做分析
const analysisSingle = (repos) => {
  getCommitDays(repos);
  getLatestTime(repos);
  getPeriodNums(repos);
};

// 分析每个仓库 上午，下午，晚上，凌晨的提交次数
const getPeriodNums = (repos) => {
  repos.forEach(repo => {
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
const getCommitDays = (repos) => {
  repos.forEach(repo => {
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
const getLatestTime = (repos) => {
  // 23:00 - 4:00 睡得较晚
  const late = [23, 0, 1, 2, 3];
  repos.forEach(repo => {
    repo.latestTime = '';
    repo.commitTime.forEach(time => {
      // 在这几个时间段内
      const current = new Date(time);
      if (late.includes(current.getHours())) {
        if (repo.latestTime === '') {
          repo.latestTime = new Date(time);
        } else {
          repo.latestTime = compareLate(repo.latestTime, current);
        }
      }
    });
  });
};

export default analysisSingle;