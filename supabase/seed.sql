-- ============================================================
-- CodeTown — Seed Data v1.0
-- 在 schema.sql 执行成功后再运行此文件
-- ============================================================

-- ============================================================
-- 内置技能包（5 条，is_builtin = TRUE，user_id = NULL）
-- ============================================================

DELETE FROM skills WHERE is_builtin = TRUE;
INSERT INTO skills (user_id, name, target_agent, content, is_builtin) VALUES
(NULL, '响应式布局',   'builder',  '确保所有内容在 320px–1440px 屏幕宽度下均正常显示。使用相对单位（%、rem、vh），不使用固定像素宽度布局。', TRUE),
(NULL, '暗黑模式',    'builder',  '为页面提供暗黑模式支持，使用 CSS 变量定义颜色，通过 prefers-color-scheme 媒体查询自动切换。', TRUE),
(NULL, '无障碍设计',  'builder',  '所有图片添加有意义的 alt 文本，按钮和链接添加 aria-label，确保键盘可导航，颜色对比度不低于 4.5:1。', TRUE),
(NULL, '代码注释',    'builder',  '为每个 HTML 区块、重要 CSS 类和 JavaScript 函数添加简洁的中文注释，帮助读者理解代码意图。', TRUE),
(NULL, '代码整洁',    'reviewer', '检查代码是否有多余空行、重复 CSS、未使用的变量，确保缩进一致（2空格），移除所有 console.log。', TRUE);

-- ============================================================
-- 内置规则（3 条，is_builtin = TRUE，user_id = NULL）
-- ============================================================

DELETE FROM rules WHERE is_builtin = TRUE;
INSERT INTO rules (user_id, name, trigger_type, content, is_builtin) VALUES
(NULL, '测试失败自动重试',   'on_test_fail',  '如果测试失败，重新分析失败原因并修复代码，最多重试 3 次。每次重试时在代码中添加注释说明修复了什么。', TRUE),
(NULL, '任务完成后代码审查', 'on_task_done',  '每个任务完成后，快速检查代码是否符合需求清单中的对应条目，确认没有硬编码的示例文本。', TRUE),
(NULL, '部署前安全检查',    'before_deploy', '部署前检查：不得包含 eval()、document.write()、innerHTML 直接拼接用户输入，不得有 alert() 弹窗。', TRUE);

-- ============================================================
-- 验收查询（运行后应分别返回 5 和 3）
-- ============================================================

SELECT count(*) AS builtin_skills FROM skills WHERE is_builtin = TRUE;
SELECT count(*) AS builtin_rules  FROM rules  WHERE is_builtin = TRUE;
