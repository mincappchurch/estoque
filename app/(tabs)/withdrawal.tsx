import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { Product } from "@/drizzle/schema";

export default function WithdrawalScreen() {
  const colors = useColors();
  const utils = trpc.useUtils();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("");
  const [volunteerName, setVolunteerName] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [showProductList, setShowProductList] = useState(false);

  const { data: products } = trpc.products.list.useQuery();
  const { data: teams } = trpc.teams.list.useQuery();
  const { data: units } = trpc.units.list.useQuery();

  const createWithdrawal = trpc.movements.createWithdrawal.useMutation({
    onSuccess: () => {
      Alert.alert("Sucesso", "Saída registrada com sucesso!");
      // Reset form
      setSelectedProduct(null);
      setQuantity("");
      setVolunteerName("");
      setSelectedTeam(null);
      setSelectedService(null);
      setNotes("");
      // Refresh data
      utils.products.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (error) => {
      Alert.alert("Erro", error.message);
    },
  });

  const serviceTimes = ["08:30", "11:00", "17:00", "19:30"];

  const getUnitName = (unitId: string) => {
    return units?.find((u) => u.id === unitId)?.abbreviation || "";
  };

  const handleSubmit = () => {
    if (!selectedProduct) {
      Alert.alert("Erro", "Selecione um produto");
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      Alert.alert("Erro", "Informe uma quantidade válida");
      return;
    }
    if (!volunteerName.trim()) {
      Alert.alert("Erro", "Informe o nome do voluntário");
      return;
    }
    if (!selectedTeam) {
      Alert.alert("Erro", "Selecione um time");
      return;
    }
    if (!selectedService) {
      Alert.alert("Erro", "Selecione o horário do culto");
      return;
    }

    createWithdrawal.mutate({
      productId: selectedProduct.id,
      quantity,
      volunteerName: volunteerName.trim(),
      teamId: selectedTeam,
      serviceTime: selectedService as any,
      notes: notes.trim() || undefined,
    });
  };

  if (showProductList && products) {
    return (
      <ScreenContainer>
        <View className="flex-1">
          <View className="px-6 pt-6 pb-4 flex-row items-center gap-4">
            <TouchableOpacity onPress={() => setShowProductList(false)}>
              <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground">Selecionar Produto</Text>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
            {products.map((product) => (
              <TouchableOpacity
                key={product.id}
                onPress={() => {
                  setSelectedProduct(product);
                  setShowProductList(false);
                }}
                className="bg-surface rounded-xl p-4 border border-border active:opacity-80"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-foreground">{product.name}</Text>
                    <Text className="text-sm text-muted mt-1">
                      Disponível: {parseFloat(product.currentQuantity).toFixed(0)}{" "}
                      {getUnitName(product.unitId)}
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
        {/* Header */}
        <View>
          <Text className="text-3xl font-bold text-foreground">Registrar Saída</Text>
          <Text className="text-base text-muted mt-1">Preencha os dados da retirada</Text>
        </View>

        {/* Product Selection */}
        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Produto *</Text>
          <TouchableOpacity
            onPress={() => setShowProductList(true)}
            className="bg-surface rounded-xl p-4 border border-border active:opacity-80"
          >
            {selectedProduct ? (
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">
                    {selectedProduct.name}
                  </Text>
                  <Text className="text-sm text-muted mt-1">
                    Disponível: {parseFloat(selectedProduct.currentQuantity).toFixed(0)}{" "}
                    {getUnitName(selectedProduct.unitId)}
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </View>
            ) : (
              <View className="flex-row items-center justify-between">
                <Text className="text-base text-muted">Selecione um produto</Text>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quantity */}
        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Quantidade *</Text>
          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            placeholder="0"
            keyboardType="decimal-pad"
            className="bg-surface rounded-xl px-4 py-4 text-foreground text-base border border-border"
            placeholderTextColor={colors.muted}
          />
          {selectedProduct && selectedProduct.maxWithdrawalLimit && (
            <Text className="text-xs text-muted">
              Limite máximo: {parseFloat(selectedProduct.maxWithdrawalLimit).toFixed(0)}{" "}
              {getUnitName(selectedProduct.unitId)}
            </Text>
          )}
        </View>

        {/* Volunteer Name */}
        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Nome do Voluntário *</Text>
          <TextInput
            value={volunteerName}
            onChangeText={setVolunteerName}
            placeholder="Digite o nome"
            className="bg-surface rounded-xl px-4 py-4 text-foreground text-base border border-border"
            placeholderTextColor={colors.muted}
          />
        </View>

        {/* Team Selection */}
        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Time *</Text>
          <View className="gap-2">
            {teams?.map((team) => (
              <TouchableOpacity
                key={team.id}
                onPress={() => setSelectedTeam(team.id)}
                className={`rounded-xl p-4 border ${
                  selectedTeam === team.id
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                }`}
              >
                <Text
                  className={`text-base font-medium ${
                    selectedTeam === team.id ? "text-background" : "text-foreground"
                  }`}
                >
                  {team.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Service Time */}
        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Horário do Culto *</Text>
          <View className="flex-row flex-wrap gap-2">
            {serviceTimes.map((time) => (
              <TouchableOpacity
                key={time}
                onPress={() => setSelectedService(time)}
                className={`rounded-xl px-6 py-3 border ${
                  selectedService === time
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                }`}
              >
                <Text
                  className={`text-base font-medium ${
                    selectedService === time ? "text-background" : "text-foreground"
                  }`}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Observações</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Informações adicionais (opcional)"
            multiline
            numberOfLines={3}
            className="bg-surface rounded-xl px-4 py-4 text-foreground text-base border border-border"
            placeholderTextColor={colors.muted}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={createWithdrawal.isPending}
          className="bg-error rounded-xl p-4 active:opacity-80"
        >
          {createWithdrawal.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-background text-center font-semibold text-lg">
              Confirmar Saída
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
