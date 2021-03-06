import { applyPlugins, mappers, parse } from 'parse-commit-message';

import { Auto, IPlugin, VersionLabel } from '@auto-it/core';

export default class ConventionalCommitsPlugin implements IPlugin {
  name = 'Conventional Commits Parser';

  apply(auto: Auto) {
    auto.hooks.onCreateLogParse.tap(this.name, logParse => {
      logParse.hooks.parseCommit.tap(this.name, commit => {
        if (!auto.semVerLabels) {
          return commit;
        }

        try {
          const [conventionalCommit] = applyPlugins(
            mappers.increment,
            parse(commit.subject)
          );
          const incrementLabel = auto.semVerLabels.get(
            conventionalCommit.increment as VersionLabel
          );

          if (conventionalCommit.header && incrementLabel) {
            commit.labels = [...commit.labels, incrementLabel];
          }
        } catch (error) {
          auto.logger.verbose.info(
            `No conventional commit message found for ${commit.hash}`
          );
        }

        return commit;
      });

      // should omit PR commit if there exists a commit with a CC commit message
      logParse.hooks.omitCommit.tapPromise(this.name, async commit => {
        // tslint:disable-next-line early-exit
        if (
          auto.git &&
          auto.release &&
          commit.pullRequest &&
          commit.labels.length === 0
        ) {
          const lastRelease = await auto.git.getLatestRelease();
          const allCommits = await auto.release.getCommits(lastRelease);
          const prCommits = await auto.git.getCommitsForPR(
            commit.pullRequest.number
          );
          const allPrCommitHashes = prCommits.reduce(
            (all, pr) => [...all, pr.sha],
            [] as string[]
          );
          const extendedCommitsInPr = allCommits.filter(c =>
            allPrCommitHashes.includes(c.hash)
          );

          return Boolean(
            extendedCommitsInPr.find(c => Boolean(parse(c.subject)[0].header))
          );
        }
      });
    });
  }
}
