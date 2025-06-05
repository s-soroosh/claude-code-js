const express = require('express');
const path = require('path');
const { ClaudeCode } = require('claude-code-js');

const app = express();
const PORT = process.env.PORT || 3001;

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test endpoint to check permissions
app.get('/test-permissions', async (req, res) => {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    try {
        // Test direct CLI command with permissions flag
        const { stdout, stderr } = await execPromise(
            'claude --dangerously-skip-permissions --output-format json --print "List files in current directory"',
            { cwd: '/workspace' }
        );
        
        res.json({
            success: true,
            stdout: stdout,
            stderr: stderr,
            cwd: process.cwd()
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message,
            stdout: error.stdout,
            stderr: error.stderr
        });
    }
});

// Chat endpoint that supports both streaming and non-streaming
app.get('/chat', async (req, res) => {
    const { prompt, stream, model, skipPermissions } = req.query;
    
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log(`[${new Date().toISOString()}] Request params:`, { prompt, stream, model, skipPermissions });

    const claudeCode = new ClaudeCode({
        model: model || undefined,
        verbose: true,
        dangerouslySkipPermissions: skipPermissions === 'true',
        workingDirectory: '/workspace'
    });

    if (stream === 'true') {
        console.log(`[${new Date().toISOString()}] Starting streaming request`);
        
        // Set up Server-Sent Events
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });

        try {
            const response = await claudeCode.chat({
                prompt: prompt,
                stream: true
            });

            console.log(`[${new Date().toISOString()}] Got streaming response`);

            if (response && response.on) {
                let lastContent = '';
                
                // Listen for debug events to capture assistant messages
                response.on('debug', (event) => {
                    console.log(`[${new Date().toISOString()}] Debug event:`, JSON.stringify(event));
                    
                    // Check if this is an assistant message with content
                    if (event.type === 'assistant' && event.message && event.message.content) {
                        const content = event.message.content;
                        if (Array.isArray(content) && content.length > 0 && content[0].text) {
                            const fullText = content[0].text;
                            // Only send the new part
                            if (fullText.startsWith(lastContent)) {
                                const newText = fullText.substring(lastContent.length);
                                if (newText) {
                                    console.log(`[${new Date().toISOString()}] New text:`, newText);
                                    res.write(`data: ${JSON.stringify({ type: 'token', content: newText })}\n\n`);
                                    lastContent = fullText;
                                }
                            } else {
                                // Full new text
                                console.log(`[${new Date().toISOString()}] Full text:`, fullText);
                                res.write(`data: ${JSON.stringify({ type: 'token', content: fullText })}\n\n`);
                                lastContent = fullText;
                            }
                        }
                    }
                });
                
                // Handle standard events
                response.on('token', (token) => {
                    console.log(`[${new Date().toISOString()}] Token event:`, token);
                    res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
                });

                response.on('error', (error) => {
                    console.log(`[${new Date().toISOString()}] Error:`, error);
                    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
                    res.end();
                });

                response.on('complete', (result) => {
                    console.log(`[${new Date().toISOString()}] Complete:`, result);
                    res.write(`data: ${JSON.stringify({ type: 'complete', content: result })}\n\n`);
                    res.end();
                });

                // Handle client disconnect
                let completed = false;
                response.on('complete', () => {
                    completed = true;
                });
                
                req.on('close', () => {
                    console.log(`[${new Date().toISOString()}] Client disconnected`);
                    // Only abort if not already completed
                    if (response && response.abort && !completed) {
                        response.abort();
                    }
                });
                
                // Catch any abort errors to prevent server crash
                response.result.catch(err => {
                    if (err.message === 'Stream aborted by user') {
                        console.log(`[${new Date().toISOString()}] Stream aborted (client disconnected)`);
                    } else {
                        console.error(`[${new Date().toISOString()}] Stream error:`, err);
                    }
                });
            } else {
                console.log(`[${new Date().toISOString()}] No streaming available`);
                res.write(`data: ${JSON.stringify({ type: 'error', message: 'Streaming not available' })}\n\n`);
                res.end();
            }
        } catch (error) {
            console.log(`[${new Date().toISOString()}] Error:`, error);
            res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
            res.end();
        }
    } else {
        // Non-streaming response
        try {
            const startTime = Date.now();
            console.log(`[${new Date().toISOString()}] Starting non-streaming request`);
            
            const response = await claudeCode.chat(prompt);
            const endTime = Date.now();
            
            console.log(`[${new Date().toISOString()}] Response received in ${endTime - startTime}ms`);
            
            if (response && response.message && response.message.result) {
                res.json({ 
                    result: response.message.result,
                    debug: {
                        duration_ms: response.message.duration_ms,
                        cost_usd: response.message.cost_usd,
                        session_id: response.message.session_id
                    }
                });
            } else {
                console.error('Unexpected response format:', response);
                res.status(500).json({ error: 'Unexpected response format from Claude' });
            }
        } catch (error) {
            console.error('Chat error:', error);
            res.status(500).json({ error: error.message || 'Failed to get response from Claude' });
        }
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Claude Code Streaming Demo server running at http://localhost:${PORT}`);
    console.log(`[${new Date().toISOString()}] Server started successfully`);
});