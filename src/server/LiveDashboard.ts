import { FlowEngine } from '../core/FlowEngine';
import { Server } from 'socket.io';

/**
 * LiveDashboard - Beautiful real-time dashboard for Flow Engine
 */
export class LiveDashboard {
  private engine: FlowEngine;
  private io: Server;

  constructor(engine: FlowEngine, io: Server) {
    this.engine = engine;
    this.io = io;
  }

  /**
   * Get dashboard HTML
   */
  getDashboardHTML(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌊 Flow Engine - Live Dashboard</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            color: white;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-5px);
        }
        
        .card h3 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.3rem;
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        
        .metric:last-child {
            border-bottom: none;
        }
        
        .metric-label {
            font-weight: 500;
            color: #666;
        }
        
        .metric-value {
            font-weight: bold;
            color: #333;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-running {
            background: #4CAF50;
            animation: pulse 2s infinite;
        }
        
        .status-completed {
            background: #2196F3;
        }
        
        .status-failed {
            background: #f44336;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .flows-list {
            max-height: 400px;
            overflow-y: auto;
        }
        
        .flow-item {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
            border-left: 4px solid #667eea;
        }
        
        .flow-item h4 {
            color: #333;
            margin-bottom: 5px;
        }
        
        .flow-item p {
            color: #666;
            font-size: 0.9rem;
        }
        
        .performance-chart {
            height: 200px;
            background: #f8f9fa;
            border-radius: 8px;
            display: flex;
            align-items: end;
            padding: 10px;
            margin-top: 15px;
        }
        
        .chart-bar {
            background: #667eea;
            margin: 0 2px;
            border-radius: 4px 4px 0 0;
            min-height: 10px;
            flex: 1;
        }
        
        .footer {
            text-align: center;
            color: white;
            margin-top: 30px;
            opacity: 0.8;
        }
        
        .connection-status {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 15px;
            border-radius: 25px;
            color: white;
            font-weight: bold;
        }
        
        .connected {
            background: #4CAF50;
        }
        
        .disconnected {
            background: #f44336;
        }
    </style>
</head>
<body>
    <div class="connection-status" id="connectionStatus">Connecting...</div>
    
    <div class="container">
        <div class="header">
            <h1>🌊 Flow Engine</h1>
            <p>Live Monitoring Dashboard</p>
        </div>
        
        <div class="dashboard">
            <div class="card">
                <h3>📊 System Metrics</h3>
                <div class="metric">
                    <span class="metric-label">Memory Usage</span>
                    <span class="metric-value" id="memoryUsage">0 MB</span>
                </div>
                <div class="metric">
                    <span class="metric-label">CPU Usage</span>
                    <span class="metric-value" id="cpuUsage">0%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Active Connections</span>
                    <span class="metric-value" id="activeConnections">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Uptime</span>
                    <span class="metric-value" id="uptime">0s</span>
                </div>
            </div>
            
            <div class="card">
                <h3>⚡ Performance</h3>
                <div class="metric">
                    <span class="metric-label">Total Executions</span>
                    <span class="metric-value" id="totalExecutions">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Success Rate</span>
                    <span class="metric-value" id="successRate">0%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Average Time</span>
                    <span class="metric-value" id="averageTime">0ms</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Error Rate</span>
                    <span class="metric-value" id="errorRate">0%</span>
                </div>
            </div>
            
            <div class="card">
                <h3>🔄 Active Flows</h3>
                <div id="activeFlows" class="flows-list">
                    <p style="text-align: center; color: #666;">No active flows</p>
                </div>
            </div>
            
            <div class="card">
                <h3>📈 Recent Executions</h3>
                <div id="recentExecutions" class="flows-list">
                    <p style="text-align: center; color: #666;">No recent executions</p>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>🌊 Flow Engine - Real-time Workflow Monitoring</p>
        </div>
    </div>
    
    <script>
        const socket = io();
        const connectionStatus = document.getElementById('connectionStatus');
        
        socket.on('connect', () => {
            connectionStatus.textContent = 'Connected';
            connectionStatus.className = 'connection-status connected';
        });
        
        socket.on('disconnect', () => {
            connectionStatus.textContent = 'Disconnected';
            connectionStatus.className = 'connection-status disconnected';
        });
        
        socket.on('initial-data', (data) => {
            updateDashboard(data);
        });
        
        socket.on('live-update', (data) => {
            updateDashboard(data);
        });
        
        function updateDashboard(data) {
            // Update system metrics
            document.getElementById('memoryUsage').textContent = data.systemMetrics.memoryUsage + ' MB';
            document.getElementById('cpuUsage').textContent = Math.round(data.systemMetrics.cpuUsage) + '%';
            document.getElementById('activeConnections').textContent = data.systemMetrics.activeConnections;
            document.getElementById('uptime').textContent = formatUptime(data.uptime);
            
            // Update performance metrics
            const totalExecutions = data.recentExecutions.length;
            const successfulExecutions = data.recentExecutions.filter(exec => exec.status === 'completed').length;
            const successRate = totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0;
            const averageTime = totalExecutions > 0 ? Math.round(data.recentExecutions.reduce((sum, exec) => sum + exec.executionTime, 0) / totalExecutions) : 0;
            
            document.getElementById('totalExecutions').textContent = totalExecutions;
            document.getElementById('successRate').textContent = successRate + '%';
            document.getElementById('averageTime').textContent = averageTime + 'ms';
            document.getElementById('errorRate').textContent = (100 - successRate) + '%';
            
            // Update active flows
            updateActiveFlows(data.activeFlows);
            
            // Update recent executions
            updateRecentExecutions(data.recentExecutions.slice(0, 10));
        }
        
        function updateActiveFlows(flows) {
            const container = document.getElementById('activeFlows');
            if (flows.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #666;">No active flows</p>';
                return;
            }
            
            container.innerHTML = flows.map(flow => \`
                <div class="flow-item">
                    <h4>
                        <span class="status-indicator status-running"></span>
                        \${flow.flowId}
                    </h4>
                    <p>Execution ID: \${flow.id}</p>
                    <p>Duration: \${Math.round((Date.now() - flow.startTime) / 1000)}s</p>
                    <p>Memory: \${Math.round(flow.memoryUsage / 1024 / 1024)}MB</p>
                </div>
            \`).join('');
        }
        
        function updateRecentExecutions(executions) {
            const container = document.getElementById('recentExecutions');
            if (executions.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #666;">No recent executions</p>';
                return;
            }
            
            container.innerHTML = executions.map(exec => \`
                <div class="flow-item">
                    <h4>
                        <span class="status-indicator status-\${exec.status}"></span>
                        \${exec.flowId}
                    </h4>
                    <p>Execution Time: \${exec.executionTime}ms</p>
                    <p>Nodes: \${exec.executionPath.length}</p>
                    <p>Memory: \${Math.round(exec.memoryUsage / 1024 / 1024)}MB</p>
                </div>
            \`).join('');
        }
        
        function formatUptime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            return \`\${hours}h \${minutes}m \${secs}s\`;
        }
        
        // Request updates every 5 seconds
        setInterval(() => {
            socket.emit('request-update');
        }, 5000);
    </script>
</body>
</html>
    `;
  }
}
