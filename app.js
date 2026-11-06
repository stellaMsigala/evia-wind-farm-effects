(function () {
  "use strict";

  const library = window.WIND_LIBRARY;
  if (!library || !Array.isArray(library.entries)) {
    document.body.insertAdjacentHTML("beforeend", "<p>Map catalogue could not be loaded.</p>");
    return;
  }

  const entries = library.entries;
  const timestamps = [...new Set(entries.map((entry) => entry.timestamp_utc))].sort();
  const heights = [...new Set(entries.map((entry) => Number(entry.height_m)))].sort((a, b) => a - b);

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).format(date).replace(",", "") + " UTC";
  }

  function fillSelect(select, values, label) {
    for (const value of values) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label(value);
      select.appendChild(option);
    }
  }

  function validTimestamp(value, fallback) {
    return timestamps.includes(value) ? value : fallback;
  }

  function validHeight(value, fallback) {
    const number = Number(value);
    return heights.includes(number) ? number : fallback;
  }

  const params = new URLSearchParams(window.location.search);
  const defaultLeftTime = timestamps[0];
  const defaultRightTime = timestamps[Math.min(1, timestamps.length - 1)];
  const defaultLeftHeight = heights.includes(100) ? 100 : heights[0];
  const defaultRightHeight = heights.includes(250) ? 250 : heights[heights.length - 1];

  const state = {
    l: {
      time: validTimestamp(params.get("time_l"), defaultLeftTime),
      height: validHeight(params.get("height_l"), defaultLeftHeight)
    },
    r: {
      time: validTimestamp(params.get("time_r"), defaultRightTime),
      height: validHeight(params.get("height_r"), defaultRightHeight)
    }
  };

  for (const side of ["l", "r"]) {
    const timeSelect = document.getElementById(`time-${side}`);
    const heightSelect = document.getElementById(`height-${side}`);
    fillSelect(timeSelect, timestamps, formatTime);
    fillSelect(heightSelect, heights, (height) => `${height} m`);
    timeSelect.value = state[side].time;
    heightSelect.value = String(state[side].height);

    document.getElementById(`form-${side}`).addEventListener("submit", function (event) {
      event.preventDefault();
      state[side].time = timeSelect.value;
      state[side].height = Number(heightSelect.value);
      render(side);
      updateAddress();
    });
  }

  function render(side) {
    const selection = state[side];
    const entry = entries.find((item) =>
      item.timestamp_utc === selection.time && Number(item.height_m) === selection.height
    );
    if (!entry) return;

    const image = document.getElementById(`image-${side}`);
    const link = document.getElementById(`link-${side}`);
    const caption = document.getElementById(`caption-${side}`);
    image.src = entry.src;
    image.alt = `Wind-speed difference at ${selection.height} metres AGL on ${formatTime(selection.time)}`;
    link.href = entry.src;
    caption.textContent = `${formatTime(selection.time)}, ${selection.height} m AGL`;
  }

  function updateAddress() {
    const next = new URLSearchParams();
    next.set("time_l", state.l.time);
    next.set("height_l", state.l.height);
    next.set("time_r", state.r.time);
    next.set("height_r", state.r.height);
    history.replaceState(null, "", `${window.location.pathname}?${next.toString()}`);
  }

  render("l");
  render("r");
  updateAddress();
})();
