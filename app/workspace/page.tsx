// app/workspace/page.tsx
'use client';

import { useEffect, useState } from 'react';

interface AgentState {
  agentId: string;
  state: 'working' | 'online' | 'idle' | 'offline';
  lastActive: number | null;
}

interface Skill {
  name: string;
  description: string;
  version: string;
  status: string;
}

const STATE_CONFIG = {
  working: { label: '工作中', emoji: '🔥', color: 'bg-green-500' },
  online: { label: '在线', emoji: '🟢', color: 'bg-blue-500' },
  idle: { label: '空闲', emoji: '😴', color: 'bg-yellow-500' },
  offline: { label: '离线', emoji: '⚫', color: 'bg-gray-500' },
};

function AgentCard({ agent }: { agent: AgentState }) {
  const config = STATE_CONFIG[agent.state] || STATE_CONFIG.offline;
  const lastActiveText = agent.lastActive
    ? new Date(agent.lastActive).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : '无记录';

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 hover:border-[var(--accent)]/50 transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-3 h-3 rounded-full ${config.color}`} />
        <span className="text-2xl">{config.emoji}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{agent.agentId}</h3>
          <p className="text-xs text-[var(--text-muted)]">{config.label}</p>
        </div>
      </div>
      <div className="text-xs text-[var(--text-muted)]">
        最后活跃: {lastActiveText}
      </div>
    </div>
  );
}

function SkillCard({ skill }: { skill: Skill }) {
  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-3 hover:border-[var(--accent)]/50 transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-sm truncate">{skill.name}</h4>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
          skill.status === 'running' 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-gray-500/20 text-gray-400'
        }`}>
          {skill.status === 'running' ? '运行中' : '已禁用'}
        </span>
      </div>
      <p className="text-xs text-[var(--text-muted)] line-clamp-2">
        {skill.description || '无描述'}
      </p>
      <p className="text-[10px] text-[var(--accent)] mt-2">
        v{skill.version}
      </p>
    </div>
  );
}

export default function WorkspacePage() {
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    async function fetchData() {
      try {
        const [agentRes, skillsRes] = await Promise.all([
          fetch('/api/agent-status'),
          fetch('/api/skills'),
        ]);
        const agentData = await agentRes.json();
        const skillsData = await skillsRes.json();
        
        // Handle both old and new skill format
        if (Array.isArray(skillsData.skills)) {
          setSkills(skillsData.skills.map((s: any) => ({
            name: s.name || s.id || '未知',
            description: s.description || '',
            version: s.version || 'unknown',
            status: 'running',
          })));
        }
        
        setAgents(agentData.statuses || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
        setLastRefresh(new Date());
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 15000); // 15秒刷新
    return () => clearInterval(interval);
  }, []);

  const workingCount = agents.filter(a => a.state === 'working').length;
  const onlineCount = agents.filter(a => a.state === 'online' || a.state === 'working').length;

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* 头部 */}
      <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">🤖 Agent 工作台</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            实时监控所有 Agent 状态 · {lastRefresh.toLocaleTimeString('zh-CN')} 更新
          </p>
        </div>
        <div className="flex gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs">
            <span className="text-[var(--text-muted)]">在线:</span>
            <span className="font-semibold ml-1">{onlineCount}/{agents.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs">
            <span className="text-[var(--text-muted)]">工作中:</span>
            <span className="font-semibold ml-1 text-green-400">{workingCount}</span>
          </div>
        </div>
      </div>

      {/* Agent 网格 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">📊 Agent 状态</h2>
        {loading ? (
          <div className="text-center py-8 text-[var(--text-muted)]">加载中...</div>
        ) : agents.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-muted)] rounded-xl border border-[var(--border)] bg-[var(--card)]">
            暂无 Agent 数据
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {agents.map((agent) => (
              <AgentCard key={agent.agentId} agent={agent} />
            ))}
          </div>
        )}
      </section>

      {/* 技能列表 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">📦 已安装技能</h2>
          <span className="text-xs text-[var(--text-muted)]">
            共 {skills.length} 个技能
          </span>
        </div>
        {loading ? (
          <div className="text-center py-8 text-[var(--text-muted)]">加载中...</div>
        ) : skills.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-muted)] rounded-xl border border-[var(--border)] bg-[var(--card)]">
            暂无技能
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {skills.map((skill) => (
              <SkillCard key={skill.name} skill={skill} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
