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
}

export const AGENTS: AgentData[] = [
  {
    id: 'planner',
    name: '计划者',
    role: 'planner',
    description: '此处为相应agent角色任务的描述',
    status: 'done',
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
    status: 'running',
    avatar: builderAvatar,
    thinkingIcon: houseIcon,
    cardBg: cardBg2,
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
  },
]

export const THINKING_MESSAGES: ThinkingMessageData[] = [
  {
    id: 'msg-1',
    agentId: 'planner',
    agentName: '规划者',
    content: '让我想想怎么搭建……让我画一个施工流程图',
    icon: glassesIcon,
  },
  {
    id: 'msg-2',
    agentId: 'builder',
    agentName: '建造者',
    content: '这个功能有意思！',
    icon: houseIcon,
  },
  {
    id: 'msg-3',
    agentId: 'builder',
    agentName: '建造者',
    content: '让我在这里用个循环……',
    icon: houseIcon,
  },
  {
    id: 'msg-4',
    agentId: 'builder',
    agentName: '建造者',
    content: '这段代码写得好漂亮！嘿嘿',
    icon: houseIcon,
  },
  {
    id: 'msg-5',
    agentId: 'tester',
    agentName: '测试者',
    content: '让我来检查一下！这个按钮能点吗？',
    icon: documentIcon,
  },
  {
    id: 'msg-6',
    agentId: 'reviewer',
    agentName: '审核者',
    content: '这段代码可以再简洁一些',
    icon: fistIcon,
  },
]
