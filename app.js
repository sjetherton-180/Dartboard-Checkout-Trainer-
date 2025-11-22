// ...[everything above remains the same]...

function hitSegment(num, mult, markerInfo) {
  if (darts.length >= 3) return;

  const val = num * mult;
  darts.push(val);
  beep();
  updateDartsDisplay();

  // Add animated dart marker
  if (markerInfo) {
    const svg = document.querySelector("#dartboard-container svg");
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    // Calculate accurate radius for each ring
    let radius;
    switch (markerInfo.ring) {
      case 'T':
        radius = (tripleOuter + tripleInner) / 2;
        break;
      case 'D':
        radius = (doubleOuter + doubleInner) / 2;
        break;
      case 'SB':
        radius = bullOuter / 2;
        break;
      case 'DB':
        radius = bullInner / 2;
        break;
      default:
        radius = (singleOuter + tripleOuter) / 2;
    }

    const pos = polarToCartesian(markerInfo.cx, markerInfo.cy, radius, markerInfo.angle);
    marker.setAttribute("cx", pos.x);
    marker.setAttribute("cy", pos.y);
    marker.setAttribute("r", 0); // start small for animation
    marker.setAttribute("fill", "orange");
    marker.setAttribute("stroke", "black");
    marker.setAttribute("stroke-width", "1");
    svg.appendChild(marker);
    dartMarkers.push(marker);

    // Animate marker pop
    let r = 0;
    const targetR = 6;
    const anim = setInterval(() => {
      r += 1;
      if (r >= targetR) {
        r = targetR;
        clearInterval(anim);
      }
      marker.setAttribute("r", r);
    }, 15);
  }

  const total = darts.reduce((a, b) => a + b, 0);
  const combos = checkouts[targetScore] || [];
  const standardCombo = combos.length > 0 ? combos[0] : null;
  const standardCodes = standardCombo ? standardCombo.map(h => h.code).join(', ') : '(none)';

  if (total === targetScore && mult === 2) {
    score++;
    addHistory(true, standardCodes, total);
    resetRound();
  } else if (total > targetScore || darts.length === 3) {
    score--;
    addHistory(false, standardCodes, total);
    resetRound();
  }

  updateScore();
}
