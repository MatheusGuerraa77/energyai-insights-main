export async function getDashboardData() {
  const response = await fetch("/data/dashboard_data.json");
  return response.json();
}

export async function getChartData() {
  const response = await fetch("/data/chart_data.json");
  return response.json();
}