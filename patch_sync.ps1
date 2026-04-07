$path = "c:\Users\Abdurahmon\learning-management\app\[locale]\(admin)\admin\tests\[testId]\builder\_components\TestBuilderClient.tsx"
$lines = Get-Content -LiteralPath $path
$newLines = @()
for ($i=0; $i -lt $lines.Length; $i++) {
    if ($i -ge 1244 -and $i -le 1253) {
        if ($i -eq 1244) {
            $newLines += '    updateGroupsForActiveStructure((groups) =>'
            $newLines += '      groups.map((group) => {'
            $newLines += '        if (group.id !== groupId) return group;'
            $newLines += ''
            $newLines += '        const updatedQuestions = group.questions.map((q) => (q.id === questionId ? updater(q) : q));'
            $newLines += '        const changedQuestion = updatedQuestions.find((q) => q.id === questionId);'
            $newLines += ''
            $newLines += '        if (!changedQuestion) return group;'
            $newLines += ''
            $newLines += '        // Cascade group-wide options for matching types'
            $newLines += '        const isMatchingHeadings = changedQuestion.type === "matching_headings";'
            $newLines += '        const isOtherMatching ='
            $newLines += '          changedQuestion.type === "matching_information" ||'
            $newLines += '          changedQuestion.type === "matching_features" ||'
            $newLines += '          changedQuestion.type === "selecting_from_a_list" ||'
            $newLines += '          changedQuestion.type === "map";'
            $newLines += ''
            $newLines += '        if (isMatchingHeadings || isOtherMatching) {'
            $newLines += '          const sourceQuestion = changedQuestion as any;'
            $newLines += '          return {'
            $newLines += '            ...group,'
            $newLines += '            questions: updatedQuestions.map((q) => {'
            $newLines += '              if (q.id === questionId) return q;'
            $newLines += '              const other = q as any;'
            $newLines += '              if (isMatchingHeadings) {'
            $newLines += '                return {...other, headings: [...sourceQuestion.headings]};'
            $newLines += '              }'
            $newLines += '              return {...other, choices: [...sourceQuestion.choices]};'
            $newLines += '            })'
            $newLines += '          };'
            $newLines += '        }'
            $newLines += ''
            $newLines += '        return {...group, questions: updatedQuestions};'
            $newLines += '      })'
        }
    } else {
        $newLines += $lines[$i]
    }
}
$newLines | Set-Content -LiteralPath $path
