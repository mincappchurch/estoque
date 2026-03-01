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
import { supabase } from "@/lib/supabase";

type CategoryOption = {
  id: string;
  name: string;
};

type UnitOption = {
  id: string;
  abbreviation: string;
};

export default function AddProductScreen() {
  const colors = useColors();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [currentQuantity, setCurrentQuantity] = useState("");
  const [minimumStock, setMinimumStock] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [maxWithdrawalLimit, setMaxWithdrawalLimit] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [unitsError, setUnitsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError(null);
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        setCategoriesError(error.message);
        setCategories([]);
      } else {
        setCategories((data ?? []) as CategoryOption[]);
      }
      setCategoriesLoading(false);
    };

    const loadUnits = async () => {
      setUnitsLoading(true);
      setUnitsError(null);
      const { data, error } = await supabase
        .from("units")
        .select("id, abbreviation")
        .order("name", { ascending: true });

      if (error) {
        setUnitsError(error.message);
        setUnits([]);
      } else {
        setUnits((data ?? []) as UnitOption[]);
      }
      setUnitsLoading(false);
    };

    loadCategories();
    loadUnits();
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Erro", "Informe o nome do produto");
      return;
    }
    if (!selectedCategory) {
      Alert.alert("Erro", "Selecione uma categoria");
      return;
    }
    if (!selectedUnit) {
      Alert.alert("Erro", "Selecione uma unidade de medida");
      return;
    }
    if (!currentQuantity || parseFloat(currentQuantity) < 0) {
      Alert.alert("Erro", "Informe a quantidade atual");
      return;
    }
    if (!minimumStock || parseFloat(minimumStock) < 0) {
      Alert.alert("Erro", "Informe o estoque mínimo");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from("products").insert({
        name: name.trim(),
        description: description.trim() || null,
        category_id: selectedCategory,
        unit_id: selectedUnit,
        current_quantity: currentQuantity,
        minimum_stock: minimumStock,
        unit_cost: unitCost || null,
        max_withdrawal_limit: maxWithdrawalLimit || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      Alert.alert("Sucesso", "Produto cadastrado com sucesso!");
      router.back();
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao cadastrar produto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4 flex-row items-center gap-4 border-b border-border">
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">Novo Produto</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
          {/* Name */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Nome do Produto *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex: Café em Pó"
              className="bg-surface rounded-xl px-4 py-4 text-foreground text-base border border-border"
              placeholderTextColor={colors.muted}
            />
          </View>

          {/* Description */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Descrição</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Descrição do produto (opcional)"
              multiline
              numberOfLines={3}
              className="bg-surface rounded-xl px-4 py-4 text-foreground text-base border border-border"
              placeholderTextColor={colors.muted}
              textAlignVertical="top"
            />
          </View>

          {/* Category */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Categoria *</Text>
            <View className="gap-2">
              {categoriesLoading ? (
                <View className="bg-surface rounded-xl p-4 border border-border flex-row items-center gap-3">
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text className="text-sm text-muted">Carregando categorias...</Text>
                </View>
              ) : categoriesError ? (
                <View className="bg-surface rounded-xl p-4 border border-warning/40">
                  <Text className="text-sm text-warning">Erro ao carregar categorias</Text>
                </View>
              ) : !categories || categories.length === 0 ? (
                <View className="bg-surface rounded-xl p-4 border border-border gap-3">
                  <Text className="text-sm text-muted">Nenhuma categoria cadastrada.</Text>
                  <TouchableOpacity
                    onPress={() => router.push("/categories")}
                    className="self-start px-4 py-2 rounded-lg bg-primary active:opacity-80"
                  >
                    <Text className="text-background font-medium">Cadastrar categoria</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => setSelectedCategory(category.id)}
                    className={`rounded-xl p-4 border ${
                      selectedCategory === category.id
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    }`}
                  >
                    <Text
                      className={`text-base font-medium ${
                        selectedCategory === category.id ? "text-background" : "text-foreground"
                      }`}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>

          {/* Unit */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Unidade de Medida *</Text>
            <View className="flex-row flex-wrap gap-2">
              {unitsLoading ? (
                <View className="bg-surface rounded-xl p-4 border border-border flex-row items-center gap-3 w-full">
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text className="text-sm text-muted">Carregando unidades...</Text>
                </View>
              ) : unitsError ? (
                <View className="bg-surface rounded-xl p-4 border border-warning/40 w-full">
                  <Text className="text-sm text-warning">Erro ao carregar unidades</Text>
                </View>
              ) : !units || units.length === 0 ? (
                <View className="bg-surface rounded-xl p-4 border border-border gap-3 w-full">
                  <Text className="text-sm text-muted">Nenhuma unidade cadastrada.</Text>
                  <TouchableOpacity
                    onPress={() => router.push("/units")}
                    className="self-start px-4 py-2 rounded-lg bg-primary active:opacity-80"
                  >
                    <Text className="text-background font-medium">Cadastrar unidade</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                units.map((unit) => (
                  <TouchableOpacity
                    key={unit.id}
                    onPress={() => setSelectedUnit(unit.id)}
                    className={`rounded-xl px-6 py-3 border ${
                      selectedUnit === unit.id
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    }`}
                  >
                    <Text
                      className={`text-base font-medium ${
                        selectedUnit === unit.id ? "text-background" : "text-foreground"
                      }`}
                    >
                      {unit.abbreviation}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>

          {/* Current Quantity */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Quantidade Atual *</Text>
            <TextInput
              value={currentQuantity}
              onChangeText={setCurrentQuantity}
              placeholder="0"
              keyboardType="decimal-pad"
              className="bg-surface rounded-xl px-4 py-4 text-foreground text-base border border-border"
              placeholderTextColor={colors.muted}
            />
          </View>

          {/* Minimum Stock */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Estoque Mínimo *</Text>
            <TextInput
              value={minimumStock}
              onChangeText={setMinimumStock}
              placeholder="0"
              keyboardType="decimal-pad"
              className="bg-surface rounded-xl px-4 py-4 text-foreground text-base border border-border"
              placeholderTextColor={colors.muted}
            />
            <Text className="text-xs text-muted">
              Você será alertado quando o estoque atingir este valor
            </Text>
          </View>

          {/* Unit Cost */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Custo Unitário (R$)</Text>
            <TextInput
              value={unitCost}
              onChangeText={setUnitCost}
              placeholder="0.00"
              keyboardType="decimal-pad"
              className="bg-surface rounded-xl px-4 py-4 text-foreground text-base border border-border"
              placeholderTextColor={colors.muted}
            />
          </View>

          {/* Max Withdrawal Limit */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Limite Máximo de Saída</Text>
            <TextInput
              value={maxWithdrawalLimit}
              onChangeText={setMaxWithdrawalLimit}
              placeholder="0"
              keyboardType="decimal-pad"
              className="bg-surface rounded-xl px-4 py-4 text-foreground text-base border border-border"
              placeholderTextColor={colors.muted}
            />
            <Text className="text-xs text-muted">
              Quantidade máxima que pode ser retirada por vez
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving}
            className="bg-primary rounded-xl p-4 active:opacity-80 mt-4"
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-background text-center font-semibold text-lg">
                Cadastrar Produto
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
