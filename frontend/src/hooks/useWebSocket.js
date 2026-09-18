import { useState, useEffect, useRef, useCallback } from 'react';

export const useWebSocket = (pollId, onVoteUpdate) => {
  const [status, setStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'disconnected'
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (!pollId) return;

    setStatus('connecting');
    const wsUrl = `ws://localhost:8080/ws/polls/${pollId}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`[WebSocket] Connected to poll ${pollId}`);
        setStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          if (onVoteUpdate && data.type === 'VOTE_UPDATE') {
            onVoteUpdate(data.poll);
          }
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('[WebSocket] Error encountered:', err);
      };

      ws.onclose = () => {
        console.log('[WebSocket] Connection closed');
        setStatus('disconnected');
        // Auto-reconnect after 3s
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
    } catch (e) {
      console.warn('[WebSocket] Server unavailable, fallback mode active.');
      setStatus('disconnected');
    }
  }, [pollId, onVoteUpdate]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  // Fallback simulator for frontend demonstration
  const simulateLiveVote = useCallback((currentPoll, setPollState) => {
    if (!currentPoll || !currentPoll.options || currentPoll.options.length === 0) return;

    const randomIndex = Math.floor(Math.random() * currentPoll.options.length);
    const updatedOptions = currentPoll.options.map((opt, idx) => {
      if (idx === randomIndex) {
        return { ...opt, votes: (opt.votes || 0) + 1 };
      }
      return opt;
    });

    const updatedPoll = {
      ...currentPoll,
      totalVotes: (currentPoll.totalVotes || 0) + 1,
      options: updatedOptions,
    };

    if (setPollState) {
      setPollState(updatedPoll);
    }
    if (onVoteUpdate) {
      onVoteUpdate(updatedPoll);
    }

    return updatedPoll;
  }, [onVoteUpdate]);

  return { status, lastMessage, simulateLiveVote };
};
