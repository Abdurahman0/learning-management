$path = "app\[locale]\(admin)\admin\tests\[testId]\builder\_components\TestBuilderClient.tsx"
$content = Get-Content $path -Raw
$target = '  const updateQuestion = \(groupId: string, questionId: string, updater: \(question: BuilderQuestion\) => BuilderQuestion\) => \{[\s\n\r]+updateGroupsForActiveStructure\(\(groups\) =>[\s\n\r]+groups\.map\(\(group\) =>[\s\n\r]+group\.id === groupId[\s\n\r]+\? \{[\s\r\n]+\.\.\.group,[\s\r\n]+questions: group\.questions\.map\(\(question\) => \(question\.id === questionId \? updater\(question\) : question\)\)[\s\r\n]+\}[\s\r\n]+: group[\s\r\n]+\)[\s\r\n]+\);[\s\r\n]+\};'
$replacement = '  const updateQuestion = (groupId: string, questionId: string, updater: (question: BuilderQuestion) => BuilderQuestion) => {
    updateGroupsForActiveStructure((groups) =>
      groups.map((group) => {
        if (group.id !== groupId) return group;

        const updatedQuestions = group.questions.map((q) => (q.id === questionId ? updater(q) : q));
        const changedQuestion = updatedQuestions.find((q) => q.id === questionId);

        if (!changedQuestion) return group;

        // Cascade group-wide options for matching types
        const isMatchingHeadings = changedQuestion.type === "matching_headings";
        const isOtherMatching =
          changedQuestion.type === "matching_information" ||
          changedQuestion.type === "matching_features" ||
          changedQuestion.type === "selecting_from_a_list" ||
          changedQuestion.type === "map";

        if (isMatchingHeadings || isOtherMatching) {
          const sourceQuestion = changedQuestion as any;
          return {
            ...group,
            questions: updatedQuestions.map((q) => {
              if (q.id === questionId) return q;
              const other = q as any;
              if (isMatchingHeadings) {
                return {...other, headings: [...sourceQuestion.headings]};
              }
              return {...other, choices: [...sourceQuestion.choices]};
            })
          };
        }

        return {...group, questions: updatedQuestions};
      })
    );
  };'
$content -replace $target, $replacement | Set-Content $path -NoNewline
