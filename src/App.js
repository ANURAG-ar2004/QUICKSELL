import React, { useState, useEffect } from "react";
import "./kanban.css";
import { data } from "./apidata";

const PRIORITY_MAP = {
  4: { label: "Urgent", color: "#CF3A3A" },
  3: { label: "High", color: "#EB5A3C" },
  2: { label: "Medium", color: "#FFCC00" },
  1: { label: "Low", color: "#90B7F3" },
  0: { label: "No priority", color: "#B8B9BB" },
};

// Function to generate a random color
const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Function to get initials from a name
const getInitials = (name) => {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
};

const KanbanBoard = () => {
  const [tickets, setTickets] = useState(data.tickets);
  const [users, setUsers] = useState(data.users);
  const [grouping, setGrouping] = useState(
    localStorage.getItem("grouping") || "status"
  );
  const [sorting, setSorting] = useState(
    localStorage.getItem("sorting") || "priority"
  );
  const [loading, setLoading] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem("grouping", grouping);
    localStorage.setItem("sorting", sorting);
  }, [grouping, sorting]);

  const fetchData = async () => {
    try {
      const response = await fetch(
        "https://api.quickcell.co/v1/internal/frontend-assignment"
      );
      const data = await response.json();
      setTickets(data.tickets);
      setUsers(data.users);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const sortTickets = (ticketsToSort) => {
    return [...ticketsToSort].sort((a, b) => {
      if (sorting === "priority") {
        return b.priority - a.priority;
      } else {
        return new Date(a.created_at) - new Date(b.created_at);
      }
    });
  };

  const groupTickets = () => {
    let groupedData = {};

    if (grouping === "status") {
      tickets.forEach((ticket) => {
        if (!groupedData[ticket.status]) {
          groupedData[ticket.status] = [];
        }
        groupedData[ticket.status].push(ticket);
      });
    } else if (grouping === "priority") {
      Object.keys(PRIORITY_MAP).forEach((priority) => {
        groupedData[PRIORITY_MAP[priority].label] = tickets.filter(
          (ticket) => ticket.priority === Number(priority)
        );
      });
    } else if (grouping === "user") {
      users.forEach((user) => {
        groupedData[user.name] = tickets.filter(
          (ticket) => ticket.userId === user.id
        );
      });
    }

    Object.keys(groupedData).forEach((key) => {
      groupedData[key] = sortTickets(groupedData[key]);
    });

    return groupedData;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const groupedTickets = groupTickets();

  return (
    <div className="kanban-container">
      <div className="header">
        <div className="display-dropdown">
          <button
            className="display-button"
            onClick={() => setDropdownVisible(!dropdownVisible)}
          >
            Display
            <span className="icon">⌄</span>
          </button>
          {dropdownVisible && (
            <div className="dropdown-content">
              <div className="dropdown-row">
                <span>Grouping</span>
                <select
                  value={grouping}
                  onChange={(e) => setGrouping(e.target.value)}
                >
                  <option value="status">Status</option>
                  <option value="priority">Priority</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div className="dropdown-row">
                <span>Ordering</span>
                <select
                  value={sorting}
                  onChange={(e) => setSorting(e.target.value)}
                >
                  <option value="priority">Priority</option>
                  <option value="date">Date</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="board">
        {Object.entries(groupedTickets).map(([group, tickets]) => (
          <div key={group} className="column">
            <div className="column-header">
              <div className="group-title">
                <span>{group}</span>
                <span className="count">{tickets.length}</span>
              </div>
            </div>
            <div className="tickets">
              {tickets.map((ticket) => {
                const user = users.find((user) => user.id === ticket.userId);
                const initials = user ? getInitials(user.name) : "?"; // Fallback to '?' if user not found
                const randomColor = getRandomColor();

                return (
                  <div key={ticket.id} className="ticket">
                    <div className="ticket-id">{ticket.id}</div>
                    <div className="ticket-title">{ticket.title}</div>
                    <div
                      className="user-icon"
                      style={{ backgroundColor: randomColor }}
                    >
                      {initials}
                    </div>
                    <div className="ticket-tags">
                      <span
                        className="priority-tag"
                        style={{
                          backgroundColor:
                            PRIORITY_MAP[ticket.priority].color + "20",
                          color: PRIORITY_MAP[ticket.priority].color,
                        }}
                      >
                        {PRIORITY_MAP[ticket.priority].label}
                      </span>
                      {ticket.tag.map((tag) => (
                        <span key={tag} className="feature-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;
