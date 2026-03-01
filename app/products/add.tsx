import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function AddProductScreen() {
  const colors = useColors();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const [currentQuantity, setCurrentQuantity] = useState("");
  const [minimumStock, setMinimumStock] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [maxWithdrawalLimit, setMaxWithdrawalLimit] = useState("");

  const { data: categories } = trpc.categories.list.useQuery();
  const { data: units } = trpc.units.list.useQuery();

  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => {
      Alert.alert("Sucesso", "Produto cadastrado com sucesso!");
      utils.products.list.invalidate();
      utils.dashboard.stats.invalidate();
      router.back();
    },
    onError: (error) => {
      Alert.alert("Erro", error.message);
    },
  });

  const handleSubmit = () => {
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

    createProduct.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      categoryId: selectedCategory,
      unitId: selectedUnit,
      currentQuantity,
      minimumStock,
      unitCost: unitCost || undefined,
      maxWithdrawalLimit: maxWithdrawalLimit || undefined,
    });
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
              {categories?.map((category) => (
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
              ))}
            </View>
          </View>

          {/* Unit */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Unidade de Medida *</Text>
            <View className="flex-row flex-wrap gap-2">
              {units?.map((unit) => (
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
              ))}
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
            disabled={createProduct.isPending}
            className="bg-primary rounded-xl p-4 active:opacity-80 mt-4"
          >
            {createProduct.isPending ? (
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
