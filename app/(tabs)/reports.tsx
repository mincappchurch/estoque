import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  Platform,
} from "react-native";
import { useState, useMemo } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { printToFileAsync } from "expo-print";
import DateTimePicker from "@react-native-community/datetimepicker";

type ReportType = "general" | "service" | "team" | "stock";

export default function ReportsScreen() {
  const colors = useColors();
  const [reportType, setReportType] = useState<ReportType>("general");
  const [selectedService, setSelectedService] = useState<string>("08:30");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  
  // Date filters - use timestamps to avoid object reference issues
  const [startTimestamp, setStartTimestamp] = useState<number>(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [endTimestamp, setEndTimestamp] = useState<number>(Date.now());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Convert timestamps to Date objects with useMemo to prevent re-renders
  const startDate = useMemo(() => new Date(startTimestamp), [startTimestamp]);
  const endDate = useMemo(() => new Date(endTimestamp), [endTimestamp]);

  const { data: teams } = trpc.teams.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  const { data: units } = trpc.units.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();

  // Query based on report type
  const { data: serviceMovements, isLoading: serviceLoading } =
    trpc.movements.getByServiceTime.useQuery(
      { serviceTime: selectedService as any, date: new Date() },
      { enabled: reportType === "service", staleTime: 30000, refetchOnMount: false, refetchOnWindowFocus: false }
    );

   const { data: generalMovements, isLoading: generalLoading } = 
    trpc.movements.getByDateRange.useQuery(
      { startDate, endDate },
      { enabled: reportType === "general", staleTime: 30000, refetchOnMount: false, refetchOnWindowFocus: false }
    );

  const { data: teamMovements, isLoading: teamLoading } = trpc.movements.getByTeam.useQuery(
    { teamId: selectedTeam!, startDate, endDate },
    { enabled: reportType === "team" && selectedTeam !== null, staleTime: 30000, refetchOnMount: false, refetchOnWindowFocus: false }
  );

  const serviceTimes = ["08:30", "11:00", "17:00", "19:30"];

  const getProductName = (productId: string) => {
    return products?.find((p) => p.id === productId)?.name || "Produto desconhecido";
  };

  const getUnitName = (productId: string) => {
    const product = products?.find((p) => p.id === productId);
    if (!product) return "";
    return units?.find((u) => u.id === product.unitId)?.abbreviation || "";
  };

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return "N/A";
    return teams?.find((t) => t.id === teamId)?.name || "N/A";
  };

  const currentMovements =
    reportType === "general" 
      ? generalMovements 
      : reportType === "service" 
      ? serviceMovements 
      : reportType === "team" 
      ? teamMovements 
      : reportType === "stock"
      ? null // Stock report doesn't use movements
      : [];

  const isLoading = 
    reportType === "general" 
      ? generalLoading 
      : reportType === "service" 
      ? serviceLoading 
      : reportType === "team" 
      ? teamLoading 
      : reportType === "stock"
      ? false
      : false;

  // Calculate totals
  const totalItems = currentMovements?.length || 0;
  const totalQuantity = currentMovements?.reduce(
    (sum, m) => sum + parseFloat(m.quantity),
    0
  ) || 0;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const exportToPDF = async () => {
    if (reportType === "stock") {
      if (!products || products.length === 0) {
        Alert.alert("Aviso", "Não há produtos para exportar");
        return;
      }
    } else {
      if (!currentMovements || currentMovements.length === 0) {
        Alert.alert("Aviso", "Não há dados para exportar");
        return;
      }
    }

    setIsExporting(true);

    try {
      // Generate HTML content for PDF
      let reportTitle = "";
      let reportSubtitle = "";

      if (reportType === "service") {
        reportTitle = `Relatório por Culto - ${selectedService}`;
        reportSubtitle = `Data: ${formatDate(new Date())}`;
      } else if (reportType === "general") {
        reportTitle = "Relatório Geral";
        reportSubtitle = `${formatDate(startDate)} até ${formatDate(endDate)}`;
      } else if (reportType === "team") {
        reportTitle = `Relatório por Time - ${getTeamName(selectedTeam)}`;
        reportSubtitle = `${formatDate(startDate)} até ${formatDate(endDate)}`;
      } else if (reportType === "stock") {
        reportTitle = "Relatório de Estoque";
        reportSubtitle = `Data: ${formatDate(new Date())}`;
      }

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportTitle}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 40px;
      color: #1a1a1a;
      background: white;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #FF6B00;
      padding-bottom: 20px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #FF6B00;
      margin-bottom: 10px;
    }
    h1 {
      font-size: 24px;
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 14px;
      color: #666;
    }
    .summary {
      display: flex;
      justify-content: space-around;
      margin-bottom: 30px;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .summary-item {
      text-align: center;
    }
    .summary-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
    }
    .summary-value {
      font-size: 28px;
      font-weight: bold;
      color: #FF6B00;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background: #FF6B00;
      color: white;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e5e5;
      font-size: 11px;
    }
    tr:hover {
      background: #f9f9f9;
    }
    .quantity {
      font-weight: bold;
      color: #dc2626;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 10px;
      color: #999;
      border-top: 1px solid #e5e5e5;
      padding-top: 20px;
    }
    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">MINC STOCK</div>
    <h1>${reportTitle}</h1>
    <div class="subtitle">${reportSubtitle}</div>
  </div>

  <div class="summary">
    ${reportType === "stock" ? `
    <div class="summary-item">
      <div class="summary-label">Total de Produtos</div>
      <div class="summary-value">${products?.length || 0}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Produtos com Estoque Baixo</div>
      <div class="summary-value">${products?.filter(p => parseFloat(p.currentQuantity) <= parseFloat(p.minimumStock)).length || 0}</div>
    </div>
    ` : `
    <div class="summary-item">
      <div class="summary-label">Total de Saídas</div>
      <div class="summary-value">${totalItems}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Quantidade Total</div>
      <div class="summary-value">${totalQuantity.toFixed(0)}</div>
    </div>
    `}
  </div>

  <table>
    <thead>
      <tr>
        ${reportType === "stock" ? `
        <th>Produto</th>
        <th>Categoria</th>
        <th>Quantidade Atual</th>
        <th>Estoque Mínimo</th>
        <th>Status</th>
        ` : `
        <th>Produto</th>
        <th>Quantidade</th>
        <th>Voluntário</th>
        <th>Time</th>
        <th>Culto</th>
        <th>Data/Hora</th>
        `}
      </tr>
    </thead>
    <tbody>
      ${reportType === "stock" 
        ? (products || [])
          .map(
            (item) => {
              const currentQty = parseFloat(item.currentQuantity);
              const minQty = parseFloat(item.minimumStock);
              const status = currentQty <= minQty ? "⚠️ Estoque Baixo" : "✅ OK";
              const categoryName = categories?.find(c => c.id === item.categoryId)?.name || "N/A";
              const unitAbbr = units?.find(u => u.id === item.unitId)?.abbreviation || "";
              return `
        <tr>
          <td>${item.name}</td>
          <td>${categoryName}</td>
          <td class="quantity">${currentQty.toFixed(0)} ${unitAbbr}</td>
          <td>${minQty.toFixed(0)} ${unitAbbr}</td>
          <td>${status}</td>
        </tr>
      `;
            }
          )
          .join("")
        : (currentMovements || [])
          .map(
            (item) => `
        <tr>
          <td>${getProductName(item.productId)}</td>
          <td class="quantity">-${parseFloat(item.quantity).toFixed(0)} ${getUnitName(item.productId)}</td>
          <td>${item.volunteerName || "N/A"}</td>
          <td>${getTeamName(item.teamId)}</td>
          <td>${item.serviceTime || "N/A"}</td>
          <td>${new Date(item.createdAt).toLocaleString("pt-BR")}</td>
        </tr>
      `
          )
          .join("")}
    </tbody>
  </table>

  <div class="footer">
    Relatório gerado em ${new Date().toLocaleString("pt-BR")} • MINC STOCK - Sistema de Gerenciamento de Insumos
  </div>
</body>
</html>
      `;

      // Generate PDF from HTML
      const fileName = `relatorio_${reportType}_${Date.now()}.pdf`;
      const { uri } = await printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      // Share the PDF file
      if (Platform.OS === "web") {
        // For web, download the PDF
        const link = document.createElement("a");
        link.href = uri;
        link.download = fileName;
        link.click();
        Alert.alert("Sucesso", "Relatório PDF exportado com sucesso!");
      } else {
        // For mobile, share the PDF file
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Compartilhar Relatório PDF",
          UTI: "com.adobe.pdf",
        });
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      Alert.alert("Erro", "Não foi possível exportar o relatório");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4 gap-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-foreground">Relatórios</Text>
              <Text className="text-sm text-muted mt-1">Visualize saídas de produtos</Text>
            </View>
            {/* Export Button */}
            <TouchableOpacity
              onPress={exportToPDF}
              disabled={isExporting || (reportType === "stock" ? (!products || products.length === 0) : (!currentMovements || currentMovements.length === 0))}
              style={{
                backgroundColor: isExporting || (reportType === "stock" ? (!products || products.length === 0) : (!currentMovements || currentMovements.length === 0))
                  ? "#9ca3af"
                  : "#FF6B00",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                opacity: isExporting || (reportType === "stock" ? (!products || products.length === 0) : (!currentMovements || currentMovements.length === 0)) ? 0.5 : 1,
              }}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <IconSymbol name="arrow.down.doc.fill" size={20} color="white" />
              )}
              <Text style={{ color: "white", fontWeight: "600" }}>
                {isExporting ? "Exportando..." : "Exportar"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Report Type Selector */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setReportType("general")}
              style={{
                flex: 1,
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                backgroundColor: reportType === "general" ? "#FF6B00" : "#f5f5f5",
                borderColor: reportType === "general" ? "#FF6B00" : "#e5e5e5",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontWeight: "500",
                  color: reportType === "general" ? "white" : "#1a1a1a",
                }}
              >
                Geral
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setReportType("service")}
              style={{
                flex: 1,
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                backgroundColor: reportType === "service" ? "#FF6B00" : "#f5f5f5",
                borderColor: reportType === "service" ? "#FF6B00" : "#e5e5e5",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontWeight: "500",
                  color: reportType === "service" ? "white" : "#1a1a1a",
                }}
              >
                Por Culto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setReportType("team")}
              style={{
                flex: 1,
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                backgroundColor: reportType === "team" ? "#FF6B00" : "#f5f5f5",
                borderColor: reportType === "team" ? "#FF6B00" : "#e5e5e5",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontWeight: "500",
                  color: reportType === "team" ? "white" : "#1a1a1a",
                }}
              >
                Por Time
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setReportType("stock")}
              style={{
                flex: 1,
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                backgroundColor: reportType === "stock" ? "#FF6B00" : "#f5f5f5",
                borderColor: reportType === "stock" ? "#FF6B00" : "#e5e5e5",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontWeight: "500",
                  color: reportType === "stock" ? "white" : "#1a1a1a",
                }}
              >
                Estoque
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date Range Filters for General and Team */}
          {(reportType === "general" || reportType === "team") && (
            <View className="gap-3">
              <Text className="text-sm font-medium text-foreground">Período</Text>
              <View className="flex-row gap-2">
                {/* Start Date */}
                <View className="flex-1">
                  <TouchableOpacity
                    onPress={() => setShowStartPicker(true)}
                    className="bg-surface border border-border rounded-xl p-3"
                  >
                    <Text className="text-xs text-muted mb-1">Data Inicial</Text>
                    <Text className="text-sm font-medium text-foreground">
                      {formatDate(startDate)}
                    </Text>
                  </TouchableOpacity>
                  {showStartPicker && (
                    <DateTimePicker
                      value={startDate}
                      mode="date"
                      display="default"
                      onChange={(event: any, selectedDate?: Date) => {
                        setShowStartPicker(false);
                        if (selectedDate) {
                          setStartTimestamp(selectedDate.getTime());
                        }
                      }}
                    />
                  )}
                </View>

                {/* End Date */}
                <View className="flex-1">
                  <TouchableOpacity
                    onPress={() => setShowEndPicker(true)}
                    className="bg-surface border border-border rounded-xl p-3"
                  >
                    <Text className="text-xs text-muted mb-1">Data Final</Text>
                    <Text className="text-sm font-medium text-foreground">
                      {formatDate(endDate)}
                    </Text>
                  </TouchableOpacity>
                  {showEndPicker && (
                    <DateTimePicker
                      value={endDate}
                      mode="date"
                      display="default"
                      onChange={(event: any, selectedDate?: Date) => {
                        setShowEndPicker(false);
                        if (selectedDate) {
                          setEndTimestamp(selectedDate.getTime());
                        }
                      }}
                    />
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Filters */}
          {reportType === "service" && (
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Horário do Culto</Text>
              <View className="flex-row gap-2">
                {serviceTimes.map((time) => (
                  <TouchableOpacity
                    key={time}
                    onPress={() => setSelectedService(time)}
                    style={{
                      flex: 1,
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: 1,
                      backgroundColor: selectedService === time ? "#FF6B00" : "#f5f5f5",
                      borderColor: selectedService === time ? "#FF6B00" : "#e5e5e5",
                    }}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        fontWeight: "500",
                        color: selectedService === time ? "white" : "#1a1a1a",
                      }}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {reportType === "team" && (
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Selecione o Time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {teams?.map((team) => (
                  <TouchableOpacity
                    key={team.id}
                    onPress={() => setSelectedTeam(team.id)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      backgroundColor: selectedTeam === team.id ? "#FF6B00" : "#f5f5f5",
                      borderColor: selectedTeam === team.id ? "#FF6B00" : "#e5e5e5",
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "500",
                        color: selectedTeam === team.id ? "white" : "#1a1a1a",
                      }}
                    >
                      {team.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Summary */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <View className="flex-row justify-between">
              <View>
                <Text className="text-sm text-muted">Total de Saídas</Text>
                <Text className="text-2xl font-bold text-foreground mt-1">{totalItems}</Text>
              </View>
              <View>
                <Text className="text-sm text-muted text-right">Quantidade Total</Text>
                <Text className="text-2xl font-bold text-foreground mt-1 text-right">
                  {totalQuantity.toFixed(0)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Movements List or Stock List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-muted mt-4">Carregando relatório...</Text>
          </View>
        ) : reportType === "stock" ? (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 24, gap: 12 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <IconSymbol name="cube.box.fill" size={48} color={colors.muted} />
                <Text className="text-muted text-center mt-4">
                  Nenhum produto cadastrado
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View className="bg-surface rounded-xl p-4 border border-border">
                <View className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-lg font-semibold text-foreground flex-1">
                      {item.name}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <Text className="text-xl font-bold text-primary">
                        {parseFloat(item.currentQuantity).toFixed(0)}
                      </Text>
                      <Text className="text-sm text-muted">{units?.find(u => u.id === item.unitId)?.abbreviation || ""}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <IconSymbol name="cube.box.fill" size={14} color={colors.muted} />
                    <Text className="text-sm text-muted">Estoque Mínimo: {parseFloat(item.minimumStock).toFixed(0)}</Text>
                  </View>
                  {parseFloat(item.currentQuantity) <= parseFloat(item.minimumStock) && (
                    <View className="bg-error/10 px-3 py-2 rounded-lg">
                      <Text className="text-error text-xs font-medium">⚠️ Estoque baixo</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          />
        ) : (
          <FlatList
            data={currentMovements}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 24, gap: 12 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <IconSymbol name="chart.bar.fill" size={48} color={colors.muted} />
                <Text className="text-muted text-center mt-4">
                  {reportType === "team" && !selectedTeam
                    ? "Selecione um time para ver o relatório"
                    : "Nenhuma saída encontrada"}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View className="bg-surface rounded-xl p-4 border border-border">
                <View className="gap-3">
                  {/* Product and Quantity */}
                  <View className="flex-row items-center justify-between">
                    <Text className="text-lg font-semibold text-foreground flex-1">
                      {getProductName(item.productId)}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <Text className="text-xl font-bold text-error">
                        -{parseFloat(item.quantity).toFixed(0)}
                      </Text>
                      <Text className="text-sm text-muted">{getUnitName(item.productId)}</Text>
                    </View>
                  </View>

                  {/* Details */}
                  <View className="gap-2">
                    <View className="flex-row items-center gap-2">
                      <IconSymbol name="person.fill" size={14} color={colors.muted} />
                      <Text className="text-sm text-muted">{item.volunteerName}</Text>
                    </View>
                    {item.teamId && (
                      <View className="flex-row items-center gap-2">
                        <IconSymbol name="person.fill" size={14} color={colors.muted} />
                        <Text className="text-sm text-muted">Time: {getTeamName(item.teamId)}</Text>
                      </View>
                    )}
                    {item.serviceTime && (
                      <View className="flex-row items-center gap-2">
                        <IconSymbol name="checkmark.circle.fill" size={14} color={colors.muted} />
                        <Text className="text-sm text-muted">Culto: {item.serviceTime}</Text>
                      </View>
                    )}
                    <Text className="text-xs text-muted">
                      {new Date(item.createdAt).toLocaleString("pt-BR")}
                    </Text>
                  </View>

                  {/* Notes */}
                  {item.notes && (
                    <View className="bg-background rounded-lg p-3 mt-1">
                      <Text className="text-sm text-muted">{item.notes}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
