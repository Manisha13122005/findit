import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../supabase";
import "./Messages.css";

function Messages() {
  const [searchParams] = useSearchParams();

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [userNames, setUserNames] = useState({});
  const [reportNames, setReportNames] = useState({});

  const [newMessage, setNewMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  const targetUserId = searchParams.get("user");
  const reportId = searchParams.get("report");

  /* ============================= */
  /* GET CURRENT USER */
  /* ============================= */

  useEffect(() => {
    getCurrentUser();
  }, []);

  /* ============================= */
  /* LOAD MESSAGES + REALTIME */
  /* ============================= */

  useEffect(() => {
    if (!user) return;

    loadMessages();

    const handleNewMessage = (payload) => {
      const newMsg = payload.new;

      const isRelatedToCurrentUser =
        newMsg.sender_id === user.id ||
        newMsg.receiver_id === user.id;

      if (!isRelatedToCurrentUser) return;

      setMessages((currentMessages) => {
        const alreadyExists = currentMessages.some(
          (message) => message.id === newMsg.id
        );

        if (alreadyExists) {
          return currentMessages;
        }

        const updatedMessages = [
          ...currentMessages,
          newMsg,
        ];

        createConversations(updatedMessages);

        loadUserNames(updatedMessages);
        loadReportNames(updatedMessages);

        return updatedMessages;
      });
    };

    const receivedChannel = supabase
      .channel(`received-messages-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        handleNewMessage
      )
      .subscribe();

    const sentChannel = supabase
      .channel(`sent-messages-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${user.id}`,
        },
        handleNewMessage
      )
      .subscribe();

    return () => {
      supabase.removeChannel(receivedChannel);
      supabase.removeChannel(sentChannel);
    };
  }, [user]);

  /* ============================= */
  /* OPEN CHAT FROM URL */
  /* ============================= */

  useEffect(() => {
    if (!user || !targetUserId) return;

    if (targetUserId === user.id) return;

    const selectedReportId = reportId
      ? Number(reportId)
      : null;

    setSelectedUser({
      userId: targetUserId,
      lastMessage: "",
      createdAt: new Date().toISOString(),
      reportId: selectedReportId,
    });

    loadUserNames([
      {
        sender_id: targetUserId,
        receiver_id: user.id,
      },
    ]);

    if (selectedReportId) {
      loadReportNames([
        {
          report_id: selectedReportId,
        },
      ]);
    }
  }, [user, targetUserId, reportId]);

  /* ============================= */
  /* GET CURRENT USER */
  /* ============================= */

  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
      }
    } catch (error) {
      console.error(error.message);
    }

    setLoading(false);
  };

  /* ============================= */
  /* LOAD USER NAMES */
  /* ============================= */

  const loadUserNames = async (allMessages) => {
    try {
      const userIds = new Set();

      allMessages.forEach((message) => {
        if (message.sender_id) {
          userIds.add(message.sender_id);
        }

        if (message.receiver_id) {
          userIds.add(message.receiver_id);
        }
      });

      const ids = Array.from(userIds);

      if (ids.length === 0) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);

      if (error) {
        console.error(
          "Error loading user names:",
          error.message
        );

        return;
      }

      const namesMap = {};

      (data || []).forEach((profile) => {
        namesMap[profile.id] =
          profile.full_name || "LPU Student";
      });

      setUserNames((current) => ({
        ...current,
        ...namesMap,
      }));
    } catch (error) {
      console.error(
        "User name loading error:",
        error.message
      );
    }
  };

  /* ============================= */
  /* LOAD REPORT NAMES */
  /* ============================= */

  const loadReportNames = async (allMessages) => {
    try {
      const reportIds = new Set();

      allMessages.forEach((message) => {
        if (message.report_id) {
          reportIds.add(Number(message.report_id));
        }
      });

      if (reportId) {
        reportIds.add(Number(reportId));
      }

      const ids = Array.from(reportIds);

      if (ids.length === 0) return;

      const { data, error } = await supabase
        .from("reports")
        .select("id, item_name")
        .in("id", ids);

      if (error) {
        console.error(
          "Error loading report names:",
          error.message
        );

        return;
      }

      const reportsMap = {};

      (data || []).forEach((report) => {
        reportsMap[report.id] =
          report.item_name || "Item";
      });

      setReportNames((current) => ({
        ...current,
        ...reportsMap,
      }));
    } catch (error) {
      console.error(
        "Report name loading error:",
        error.message
      );
    }
  };

  /* ============================= */
  /* LOAD ALL MESSAGES */
  /* ============================= */

  const loadMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `sender_id.eq.${user.id},receiver_id.eq.${user.id}`
        )
        .order("created_at", {
          ascending: true,
        });

      if (error) throw error;

      const allMessages = data || [];

      setMessages(allMessages);

      createConversations(allMessages);

      loadUserNames(allMessages);

      loadReportNames(allMessages);
    } catch (error) {
      console.error(
        "Error loading messages:",
        error.message
      );
    }
  };

  /* ============================= */
  /* CREATE CONVERSATIONS */
  /* ============================= */

  const createConversations = (allMessages) => {
    if (!user) return;

    const conversationMap = {};

    allMessages.forEach((message) => {
      const otherUserId =
        message.sender_id === user.id
          ? message.receiver_id
          : message.sender_id;

      if (!otherUserId || otherUserId === user.id) {
        return;
      }

      const normalizedReportId =
        message.report_id !== null &&
        message.report_id !== undefined
          ? Number(message.report_id)
          : null;

      const conversationKey =
        `${otherUserId}-${normalizedReportId || "general"}`;

      if (
        !conversationMap[conversationKey] ||
        new Date(message.created_at) >
          new Date(
            conversationMap[conversationKey].createdAt
          )
      ) {
        conversationMap[conversationKey] = {
          userId: otherUserId,
          reportId: normalizedReportId,
          lastMessage: message.message,
          createdAt: message.created_at,
        };
      }
    });

    const conversationList =
      Object.values(conversationMap);

    conversationList.sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );

    setConversations(conversationList);
  };

  /* ============================= */
  /* GET CONVERSATION MESSAGES */
  /* ============================= */

  const getConversationMessages = () => {
    if (!selectedUser || !user) {
      return [];
    }

    return messages.filter((message) => {
      const isSameUsers =
        (message.sender_id === user.id &&
          message.receiver_id ===
            selectedUser.userId) ||
        (message.sender_id === selectedUser.userId &&
          message.receiver_id === user.id);

      const selectedReportId =
        selectedUser.reportId;

      const messageReportId =
        message.report_id !== null &&
        message.report_id !== undefined
          ? Number(message.report_id)
          : null;

      const isSameReport =
        messageReportId === selectedReportId;

      return isSameUsers && isSameReport;
    });
  };

  /* ============================= */
  /* AUTO SCROLL */
  /* ============================= */

  useEffect(() => {
    if (!selectedUser) return;

    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [messages, selectedUser]);

  /* ============================= */
  /* CREATE NOTIFICATION */
  /* ============================= */

  const createOrUpdateNotification = async (
    receiverId,
    currentReportId
  ) => {
    try {
      if (!user) return;

      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", receiverId)
        .eq("sender_id", user.id)
        .eq("type", "message")
        .eq("is_read", false);

      if (currentReportId) {
        query = query.eq(
          "report_id",
          Number(currentReportId)
        );
      } else {
        query = query.is(
          "report_id",
          null
        );
      }

      const {
        data: existingNotifications,
        error: searchError,
      } = await query;

      if (searchError) {
        throw searchError;
      }

      if (
        existingNotifications &&
        existingNotifications.length > 0
      ) {
        const existingNotification =
          existingNotifications[0];

        const { error: updateError } =
          await supabase
            .from("notifications")
            .update({
              message:
                "💬 You have new messages in this conversation",
              is_read: false,
              created_at: new Date().toISOString(),
            })
            .eq(
              "id",
              existingNotification.id
            );

        if (updateError) {
          throw updateError;
        }

        if (existingNotifications.length > 1) {
          const duplicateIds =
            existingNotifications
              .slice(1)
              .map(
                (notification) =>
                  notification.id
              );

          await supabase
            .from("notifications")
            .delete()
            .in("id", duplicateIds);
        }
      } else {
        const { error: notificationError } =
          await supabase
            .from("notifications")
            .insert([
              {
                user_id: receiverId,
                sender_id: user.id,

                report_id: currentReportId
                  ? Number(currentReportId)
                  : null,

                type: "message",

                message:
                  "💬 You have a new message",

                is_read: false,
              },
            ]);

        if (notificationError) {
          throw notificationError;
        }
      }
    } catch (error) {
      console.error(
        "Notification error:",
        error.message
      );
    }
  };

  /* ============================= */
  /* SEND MESSAGE */
  /* ============================= */

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      return;
    }

    if (!selectedUser) {
      alert(
        "Please select a conversation first!"
      );

      return;
    }

    if (!user) {
      alert("Please login first!");

      return;
    }

    if (selectedUser.userId === user.id) {
      alert(
        "You cannot send a message to yourself!"
      );

      return;
    }

    setSending(true);

    try {
      const messageText =
        newMessage.trim();

      const { error: messageError } =
        await supabase
          .from("messages")
          .insert([
            {
              sender_id: user.id,

              receiver_id:
                selectedUser.userId,

              message: messageText,

              report_id:
                selectedUser.reportId !== null
                  ? Number(
                      selectedUser.reportId
                    )
                  : null,
            },
          ]);

      if (messageError) {
        throw messageError;
      }

      await createOrUpdateNotification(
        selectedUser.userId,
        selectedUser.reportId
      );

      setNewMessage("");
    } catch (error) {
      console.error(error);

      alert(error.message);
    }

    setSending(false);
  };

  /* ============================= */
  /* LOADING */
  /* ============================= */

  if (loading) {
    return (
      <div className="messages-page">
        <div className="messages-loading">
          Loading messages... 💬
        </div>
      </div>
    );
  }

  return (
    <div className="messages-page">

      <div className="messages-container">

        {/* ================= HEADER ================= */}

        <div className="messages-header">

          <div>

            <div className="messages-icon">
              💬
            </div>

            <h1>
              Private Messages
            </h1>

            <p>
              Chat privately with other LPU FindIt users.
            </p>

          </div>

          <Link to="/home">

            <button className="back-home-btn">
              🏠 Back to Home
            </button>

          </Link>

        </div>


        {/* ================= CHAT LAYOUT ================= */}

        <div
          className={`chat-layout ${
            selectedUser
              ? "conversation-selected"
              : ""
          }`}
        >


          {/* ================= CONVERSATION SIDEBAR ================= */}

          <div className="conversation-sidebar">

            <div className="conversation-title">

              <h2>
                💬 Conversations
              </h2>

              <span>
                {conversations.length}
              </span>

            </div>


            {conversations.length === 0 ? (

              <div className="no-conversations">

                <div className="empty-icon">
                  💭
                </div>

                <h3>
                  No conversations yet
                </h3>

                <p>
                  Start a conversation by clicking
                  "Message Owner" on a report.
                </p>

              </div>

            ) : (

              <div className="conversation-list">

                {conversations.map(
                  (conversation) => (

                    <button

                      key={`${conversation.userId}-${conversation.reportId ?? "general"}`}

                      className={`conversation-item ${
                        selectedUser?.userId ===
                          conversation.userId &&
                        selectedUser?.reportId ===
                          conversation.reportId
                          ? "active"
                          : ""
                      }`}

                      onClick={() =>
                        setSelectedUser(conversation)
                      }
                    >

                      <div className="conversation-avatar">
                        👤
                      </div>


                      <div className="conversation-info">

                        <h3>
                          {userNames[
                            conversation.userId
                          ] || "Loading..."}
                        </h3>


                        <p>
                          {conversation.lastMessage}
                        </p>


                        {conversation.reportId && (

                          <small>

                            📦{" "}

                            {reportNames[
                              conversation.reportId
                            ] || "Loading item..."}

                          </small>

                        )}

                      </div>

                    </button>

                  )
                )}

              </div>

            )}

          </div>


          {/* ================= CHAT WINDOW ================= */}

          <div className="chat-window">

            {!selectedUser ? (

              <div className="select-conversation">

                <div className="select-icon">
                  💬
                </div>

                <h2>
                  Select a Conversation
                </h2>

                <p>
                  Choose a conversation from the left
                  or message the owner of a report.
                </p>

              </div>

            ) : (

              <>


                {/* ================= CHAT HEADER ================= */}

<div className="chat-header">

  <button
    className="mobile-back-chat"
    onClick={() => setSelectedUser(null)}
  >
    ←
  </button>

  <div className="chat-user">

    <div className="chat-avatar">
      👤
    </div>

    <div>

      <h2>
        {userNames[
          selectedUser.userId
        ] || "Loading..."}
      </h2>

      <p>
        🔒 Private conversation

        {selectedUser.reportId && (
          <>
            {" • 📦 "}

            {reportNames[
              selectedUser.reportId
            ] || "Loading item..."}
          </>
        )}
      </p>

    </div>

  </div>

</div>


                {/* ================= MESSAGES ================= */}

                <div className="messages-area">

                  {getConversationMessages().length ===
                    0 && (

                    <div className="no-chat-messages">

                      <div>
                        👋
                      </div>

                      <h3>
                        Start the conversation!
                      </h3>

                      <p>
                        Send a message about this item.
                      </p>

                    </div>

                  )}


                  {getConversationMessages().map(
                    (message) => (

                      <div

                        key={message.id}

                        className={`message-row ${
                          message.sender_id === user.id
                            ? "sent"
                            : "received"
                        }`}

                      >

                        <div className="message-bubble">

                          <p>
                            {message.message}
                          </p>

                          <span>

                            {new Date(
                              message.created_at
                            ).toLocaleString()}

                          </span>

                        </div>

                      </div>

                    )
                  )}


                  <div
                    ref={messagesEndRef}
                  ></div>

                </div>


                {/* ================= INPUT ================= */}

                <form
                  className="message-input-area"
                  onSubmit={sendMessage}
                >

                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) =>
                      setNewMessage(
                        e.target.value
                      )
                    }
                  />


                  <button
                    type="submit"
                    disabled={sending}
                  >

                    {sending
                      ? "Sending..."
                      : "➤ Send"}

                  </button>

                </form>

              </>

            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default Messages;