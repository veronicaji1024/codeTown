import plannerAvatar from '@/assets/construction/avatars/planner.png'
import builderAvatar from '@/assets/construction/avatars/builder.png'
import testerAvatar from '@/assets/construction/avatars/tester.png'
import reviewerAvatar from '@/assets/construction/avatars/reviewer.png'

import glassesIcon from '@/assets/construction/icons/glasses.svg'
import houseIcon from '@/assets/construction/icons/house.svg'
import documentIcon from '@/assets/construction/icons/document.svg'
import fistIcon from '@/assets/construction/icons/fist.svg'

import cardBg1 from '@/assets/construction/shapes/card-bg-1.svg'
import cardBg2 from '@/assets/construction/shapes/card-bg-2.svg'
import cardBg3 from '@/assets/construction/shapes/card-bg-3.svg'
import cardBg4 from '@/assets/construction/shapes/card-bg-4.svg'

export type AgentStatus = 'pending' | 'running' | 'done' | 'failed'

export interface AgentData {
  id: string
  name: string
  role: string
  description: string
  status: AgentStatus
  avatar: string
  thinkingIcon: string
  cardBg: string
  teachingMoment?: string
}

export interface ThinkingMessageData {
  id: string
  agentId: string
  agentName: string
  content: string
  icon: string
  color: string
}

export interface AgentTemplate {
  name: string
  role: string
  avatar: string
  thinkingIcon: string
  cardBg: string
  teachingMoment?: string
}

export const AGENT_TEMPLATES: Record<string, AgentTemplate> = {
  planner: {
    name: '计划者',
    role: 'planner',
    avatar: plannerAvatar,
    thinkingIcon: glassesIcon,
    cardBg: cardBg1,
    teachingMoment: '流程规划 (Planning)\nAI 在执行之前，会先把大任务拆成小步骤，这叫"规划"。',
  },
  builder: {
    name: '建造者',
    role: 'builder',
    avatar: builderAvatar,
    thinkingIcon: houseIcon,
    cardBg: cardBg2,
    teachingMoment: '代码生成 (Code Generation)\nAI 工匠根据规划好的步骤，一步步编写代码。就像盖房子要一块砖一块砖地砌。',
  },
  tester: {
    name: '测试者',
    role: 'tester',
    avatar: testerAvatar,
    thinkingIcon: documentIcon,
    cardBg: cardBg3,
    teachingMoment: '测试验证 (Testing)\n测试者会检查每个功能是否正常工作，确保没有 bug。就像房子盖好后检查水管通不通。',
  },
  reviewer: {
    name: '审核者',
    role: 'reviewer',
    avatar: reviewerAvatar,
    thinkingIcon: fistIcon,
    cardBg: cardBg4,
    teachingMoment: '代码审查 (Code Review)\n审核者会检查代码质量和安全性，确保代码整洁可靠。就像验收房子时检查每个细节。',
  },
}

export const AGENTS: AgentData[] = [
  {
    id: 'planner',
    name: '计划者',
    role: 'planner',
    description: '此处为相应agent角色任务的描述',
    status: 'pending',
    avatar: plannerAvatar,
    thinkingIcon: glassesIcon,
    cardBg: cardBg1,
    teachingMoment:
      '流程规划 (Planning)\nAI 在执行之前，会先把大任务拆成小步骤，这叫"规划"。',
  },
  {
    id: 'builder',
    name: '建造者',
    role: 'builder',
    description: '此处为相应agent角色任务的描述',
    status: 'pending',
    avatar: builderAvatar,
    thinkingIcon: houseIcon,
    cardBg: cardBg2,
    teachingMoment:
      '代码生成 (Code Generation)\nAI 工匠根据规划好的步骤，一步步编写代码。就像盖房子要一块砖一块砖地砌。',
  },
  {
    id: 'tester',
    name: '测试者',
    role: 'tester',
    description: '此处为相应agent角色任务的描述',
    status: 'pending',
    avatar: testerAvatar,
    thinkingIcon: documentIcon,
    cardBg: cardBg3,
    teachingMoment:
      '测试验证 (Testing)\n测试者会检查每个功能是否正常工作，确保没有 bug。就像房子盖好后检查水管通不通。',
  },
  {
    id: 'reviewer',
    name: '审核者',
    role: 'reviewer',
    description: '此处为相应agent角色任务的描述',
    status: 'pending',
    avatar: reviewerAvatar,
    thinkingIcon: fistIcon,
    cardBg: cardBg4,
    teachingMoment:
      '代码审查 (Code Review)\n审核者会检查代码质量和安全性，确保代码整洁可靠。就像验收房子时检查每个细节。',
  },
]

export const THINKING_MESSAGES: ThinkingMessageData[] = [
  {
    id: 'msg-1',
    agentId: 'planner',
    agentName: '规划者',
    content: '让我想想怎么搭建……让我画一个施工流程图',
    icon: glassesIcon,
    color: '#EF7267',
  },
  {
    id: 'msg-2',
    agentId: 'planner',
    agentName: '规划者',
    content: '[完成] 施工流程规划完毕',
    icon: glassesIcon,
    color: '#EF7267',
  },
  {
    id: 'msg-3',
    agentId: 'builder',
    agentName: '建造者',
    content: '这个功能有意思！',
    icon: houseIcon,
    color: '#3385FF',
  },
  {
    id: 'msg-4',
    agentId: 'builder',
    agentName: '建造者',
    content: '正在写 `<button onClick={handleClick}>` 组件',
    icon: houseIcon,
    color: '#3385FF',
  },
  {
    id: 'msg-5',
    agentId: 'builder',
    agentName: '建造者',
    content: '让我在这里用个 `for` 循环……',
    icon: houseIcon,
    color: '#3385FF',
  },
  {
    id: 'msg-6',
    agentId: 'builder',
    agentName: '建造者',
    content: '[完成] HTML 结构搭建完毕',
    icon: houseIcon,
    color: '#3385FF',
  },
  {
    id: 'msg-7',
    agentId: 'tester',
    agentName: '测试者',
    content: '让我来检查一下！这个按钮能点吗？',
    icon: documentIcon,
    color: '#4CAF50',
  },
  {
    id: 'msg-8',
    agentId: 'tester',
    agentName: '测试者',
    content: '运行 `npm test` 看看结果',
    icon: documentIcon,
    color: '#4CAF50',
  },
  {
    id: 'msg-9',
    agentId: 'reviewer',
    agentName: '审核者',
    content: '这段代码可以再简洁一些',
    icon: fistIcon,
    color: '#FF9800',
  },
  {
    id: 'msg-10',
    agentId: 'reviewer',
    agentName: '审核者',
    content: '建议把 `useState` 提取到自定义 Hook',
    icon: fistIcon,
    color: '#FF9800',
  },
]
