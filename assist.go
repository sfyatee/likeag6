package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

type AssistMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type AssistChatRequest struct {
	// Preferred: full chat history from the browser
	Messages []AssistMessage `json:"messages,omitempty"`

	// Fallback: single-turn
	Query string `json:"query,omitempty"`
}

type AssistChatResponse struct {
	Answer string `json:"answer,omitempty"`
	Error  string `json:"error,omitempty"`
}

type ollamaChatRequest struct {
	Model    string          `json:"model"`
	Messages []AssistMessage `json:"messages"`
	Stream   bool            `json:"stream"`
	Format   string          `json:"format,omitempty"` // "json" enables JSON mode on /api/chat
}

type ollamaChatResponse struct {
	Message AssistMessage `json:"message"`
	Error   string        `json:"error,omitempty"`
}

// Model reply schema (we force JSON mode + tell the model to only output this)
type assistModelReply struct {
	Kind     string          `json:"kind"`               // "final" | "call_api"
	Answer   string          `json:"answer,omitempty"`   // when kind=="final"
	Endpoint string          `json:"endpoint,omitempty"` // when kind=="call_api"
	Body     json.RawMessage `json:"body,omitempty"`     // when kind=="call_api"
	Explain  string          `json:"explain,omitempty"`  // optional
}

type assistToolResult struct {
	Ok       bool   `json:"ok"`
	Endpoint string `json:"endpoint"`
	Result   Matrix `json:"result,omitempty"`
	Error    string `json:"error,omitempty"`
}

func envOr(key, fallback string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	return v
}

func ollamaBaseURL() string {
	// Matches the style in your index.ts example (OLLAMA_BASE_URL) :contentReference[oaicite:6]{index=6}
	return envOr("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
}

func ollamaChatModel() string {
	// Matches the style in your index.ts example (OLLAMA_CHAT_MODEL) :contentReference[oaicite:7]{index=7}
	return envOr("OLLAMA_CHAT_MODEL", "llama3.2:3b")
}

func buildAssistSystemPrompt() string {
	// These endpoints match your api.md exactly :contentReference[oaicite:8]{index=8}
	return strings.TrimSpace(`
You are G6Labs Problem Assistance, a linear algebra tutor.

You have access to this server-side JSON Matrix API:
- POST /api/matrix/add        body {"A": number[][], "B": number[][]}
- POST /api/matrix/subtract   body {"A": number[][], "B": number[][]}
- POST /api/matrix/multiply   body {"A": number[][], "B": number[][]}
- POST /api/matrix/rref       body {"A": number[][]}

CRITICAL RULE:
If the user asks for any numeric matrix computation covered by these endpoints, DO NOT compute by hand.
You MUST request the API call.

OUTPUT FORMAT:
You MUST always respond with ONE valid JSON object (no markdown, no extra text).

Schema:
1) To call the API:
{
  "kind": "call_api",
  "endpoint": "/api/matrix/add | /api/matrix/subtract | /api/matrix/multiply | /api/matrix/rref",
  "body": { ... },
  "explain": "one short sentence describing what to compute"
}

2) To answer the user:
{
  "kind": "final",
  "answer": "plain text answer; may include newlines"
}

When you receive a tool result, use it and respond with kind="final".
If matrices are missing or ambiguous, ask for them in a kind="final" response.

Matrix format preference:
Ask the user to provide matrices as JSON, e.g. [[1,2],[3,4]].
`)
}

func callOllamaJSONMode(messages []AssistMessage) (string, error) {
	base := strings.TrimRight(ollamaBaseURL(), "/")
	url := base + "/api/chat" // /api/chat per Ollama docs :contentReference[oaicite:9]{index=9}

	reqPayload := ollamaChatRequest{
		Model:    ollamaChatModel(),
		Messages: messages,
		Stream:   false,  // disable streaming for a single JSON response :contentReference[oaicite:10]{index=10}
		Format:   "json", // JSON mode for reliable parsing :contentReference[oaicite:11]{index=11}
	}

	b, _ := json.Marshal(reqPayload)

	client := &http.Client{Timeout: 120 * time.Second}
	req, _ := http.NewRequest(http.MethodPost, url, bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to reach Ollama at %s: %w", url, err)
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("ollama error (%s): %s", resp.Status, strings.TrimSpace(string(raw)))
	}

	var out ollamaChatResponse
	if err := json.Unmarshal(raw, &out); err != nil {
		return "", fmt.Errorf("invalid ollama JSON: %w", err)
	}
	if out.Error != "" {
		return "", errors.New(out.Error)
	}
	if strings.TrimSpace(out.Message.Content) == "" {
		return "", errors.New("ollama returned empty message content")
	}
	return out.Message.Content, nil
}

func runMatrixEndpoint(endpoint string, body json.RawMessage) (Matrix, error) {
	if len(body) == 0 {
		return nil, errors.New("missing body")
	}

	switch endpoint {
	case "/api/matrix/add":
		var req TwoMatrixRequest
		if err := json.Unmarshal(body, &req); err != nil {
			return nil, fmt.Errorf("invalid JSON body for add: %w", err)
		}
		return add(req.A, req.B)

	case "/api/matrix/subtract":
		var req TwoMatrixRequest
		if err := json.Unmarshal(body, &req); err != nil {
			return nil, fmt.Errorf("invalid JSON body for subtract: %w", err)
		}
		return sub(req.A, req.B)

	case "/api/matrix/multiply":
		var req TwoMatrixRequest
		if err := json.Unmarshal(body, &req); err != nil {
			return nil, fmt.Errorf("invalid JSON body for multiply: %w", err)
		}
		return mul(req.A, req.B)

	case "/api/matrix/rref":
		var req OneMatrixRequest
		if err := json.Unmarshal(body, &req); err != nil {
			return nil, fmt.Errorf("invalid JSON body for rref: %w", err)
		}
		return rref(req.A)

	default:
		return nil, fmt.Errorf("endpoint not allowed: %s", endpoint)
	}
}

func handleAssistHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"error": "use GET"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"ok":              true,
		"ollamaBaseURL":   ollamaBaseURL(),
		"ollamaChatModel": ollamaChatModel(),
	})
}

func handleAssistChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, AssistChatResponse{Error: "use POST"})
		return
	}
	defer r.Body.Close()

	var req AssistChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, AssistChatResponse{Error: "invalid JSON: " + err.Error()})
		return
	}

	userMsgs := req.Messages
	if len(userMsgs) == 0 && strings.TrimSpace(req.Query) != "" {
		userMsgs = []AssistMessage{{Role: "user", Content: strings.TrimSpace(req.Query)}}
	}
	if len(userMsgs) == 0 {
		writeJSON(w, http.StatusBadRequest, AssistChatResponse{Error: "messages or query is required"})
		return
	}

	// Prepend system prompt every request (simple + stateless)
	sys := AssistMessage{Role: "system", Content: buildAssistSystemPrompt()}
	ctx := append([]AssistMessage{sys}, userMsgs...)

	// Tool loop: allow up to 2 tool calls (prevents infinite loops)
	for i := 0; i < 2; i++ {
		modelContent, err := callOllamaJSONMode(ctx)
		if err != nil {
			writeJSON(w, http.StatusBadGateway, AssistChatResponse{Error: err.Error()})
			return
		}

		var reply assistModelReply
		if err := json.Unmarshal([]byte(modelContent), &reply); err != nil {
			// If the model somehow violates JSON mode, just return raw content.
			writeJSON(w, http.StatusOK, AssistChatResponse{Answer: modelContent})
			return
		}

		switch strings.ToLower(strings.TrimSpace(reply.Kind)) {
		case "final":
			writeJSON(w, http.StatusOK, AssistChatResponse{Answer: reply.Answer})
			return

		case "call_api":
			// Run the API call using the SAME underlying functions used by your matrix endpoints :contentReference[oaicite:12]{index=12}
			result, toolErr := runMatrixEndpoint(reply.Endpoint, reply.Body)
			tr := assistToolResult{
				Ok:       toolErr == nil,
				Endpoint: reply.Endpoint,
				Result:   result,
			}
			if toolErr != nil {
				tr.Error = toolErr.Error()
			}

			trJSON, _ := json.Marshal(tr)

			// Add the tool request as the assistant message, and tool result as a user message
			ctx = append(ctx,
				AssistMessage{Role: "assistant", Content: modelContent},
				AssistMessage{Role: "user", Content: "Tool result (use this to answer): " + string(trJSON)},
			)

			// Continue loop to get final answer.
			continue

		default:
			writeJSON(w, http.StatusOK, AssistChatResponse{
				Answer: "I received an unexpected response format from the model. Try again with matrices in JSON like [[1,2],[3,4]].",
			})
			return
		}
	}

	writeJSON(w, http.StatusOK, AssistChatResponse{
		Answer: "I hit the maximum number of tool steps. Please re-ask with clearer matrices (JSON like [[1,2],[3,4]]).",
	})
}
