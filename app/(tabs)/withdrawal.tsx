import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { Product } from "@/drizzle/schema";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

type TeamOption = {
  id: string;
  name: string;
};

type UnitOption = {
  id: string;
  abbreviation: string;
};

export default function WithdrawalScreen() {
  const colors = useColors();
  const { user } = useAuth();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("");
  const [volunteerName, setVolunteerName] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [showProductList, setShowProductList] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      const { data } = await supabase.from("products").select("*").order("name", { ascending: true });
      const normalized = (data ?? []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        categoryId: row.category_id,
        unitId: row.unit_id,
        currentQuantity: row.current_quantity,
        minimumStock: row.minimum_stock,
        unitCost: row.unit_cost,
        maxWithdrawalLimit: row.max_withdrawal_limit,
        photoUrl: row.photo_url,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      })) as Product[];
      setProducts(normalized);
    };

    const loadTeams = async () => {
      setTeamsLoading(true);
      setTeamsError(null);
      const { data, error } = await supabase
        .from("teams")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        setTeamsError(error.message);
        setTeams([]);
      } else {
        setTeams((data ?? []) as TeamOption[]);
      }
      setTeamsLoading(false);
    };

    const loadUnits = async () => {
      const { data } = await supabase
        .from("units")
        .select("id, abbreviation")
        .order("name", { ascending: true });
      setUnits((data ?? []) as UnitOption[]);
    };

    loadProducts();
    loadTeams();
    loadUnits();
  }, []);

  const serviceTimes = ["08:30", "11:00", "17:00", "19:30"];

  const getUnitName = (unitId: string) => {
    return units?.find((u) => u.id === unitId)?.abbreviation || "";
  };

  const handleSubmit = async () => {
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

    if (!user?.id) {
      Alert.alert("Erro", "Sessão inválida. Faça login novamente.");
      return;
    }

    if (selectedProduct.maxWithdrawalLimit) {
      const maxLimit = parseFloat(selectedProduct.maxWithdrawalLimit);
      const requested = parseFloat(quantity);
      if (!Number.isNaN(maxLimit) && requested > maxLimit) {
        Alert.alert("Erro", `Limite máximo de saída: ${maxLimit}`);
        return;
      }
    }

    try {
      setSaving(true);
      const { error } = await supabase.rpc("fn_record_movement", {
        p_product_id: selectedProduct.id,
        p_type: "withdrawal",
        p_quantity: quantity,
        p_user_id: user.id,
        p_volunteer_name: volunteerName.trim(),
        p_team_id: selectedTeam,
        p_service_time: selectedService,
        p_notes: notes.trim() || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      Alert.alert("Sucesso", "Saída registrada com sucesso!");
      setSelectedProduct(null);
      setQuantity("");
      setVolunteerName("");
      setSelectedTeam(null);
      setSelectedService(null);
      setNotes("");
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao registrar saída");
    } finally {
      setSaving(false);
    }
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
            {teamsLoading ? (
              <View className="bg-surface rounded-xl p-4 border border-border flex-row items-center gap-3">
                <ActivityIndicator size="small" color={colors.primary} />
                <Text className="text-sm text-muted">Carregando times...</Text>
              </View>
            ) : teamsError ? (
              <View className="bg-surface rounded-xl p-4 border border-warning/40">
                <Text className="text-sm text-warning">Erro ao carregar times</Text>
              </View>
            ) : !teams || teams.length === 0 ? (
              <View className="bg-surface rounded-xl p-4 border border-border gap-3">
                <Text className="text-sm text-muted">Nenhum time cadastrado.</Text>
                <TouchableOpacity
                  onPress={() => router.push("/add-team")}
                  className="self-start px-4 py-2 rounded-lg bg-primary active:opacity-80"
                >
                  <Text className="text-background font-medium">Cadastrar time</Text>
                </TouchableOpacity>
              </View>
            ) : (
              teams.map((team) => (
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
              ))
            )}
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
          disabled={saving}
          className="bg-error rounded-xl p-4 active:opacity-80"
        >
          {saving ? (
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
