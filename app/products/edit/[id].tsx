import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function EditProductScreen() {
  const colors = useColors();
  const utils = trpc.useUtils();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = parseInt(id);

  const { data: product, isLoading } = trpc.products.getById.useQuery({ id: productId });
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: units } = trpc.units.list.useQuery();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const [minimumStock, setMinimumStock] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [maxWithdrawalLimit, setMaxWithdrawalLimit] = useState("");

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || "");
      setSelectedCategory(product.categoryId);
      setSelectedUnit(product.unitId);
      setMinimumStock(product.minimumStock);
      setUnitCost(product.unitCost || "");
      setMaxWithdrawalLimit(product.maxWithdrawalLimit || "");
    }
  }, [product]);

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => {
      Alert.alert("Sucesso", "Produto atualizado com sucesso!");
      utils.products.list.invalidate();
      utils.products.getById.invalidate({ id: productId });
      router.back();
    },
    onError: (error: any) => {
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
    if (!minimumStock || parseFloat(minimumStock) < 0) {
      Alert.alert("Erro", "Informe o estoque mínimo");
      return;
    }

    updateProduct.mutate({
      id: productId,
      name: name.trim(),
      description: description.trim() || undefined,
      categoryId: selectedCategory,
      unitId: selectedUnit,
      minimumStock,
      unitCost: unitCost || undefined,
      maxWithdrawalLimit: maxWithdrawalLimit || undefined,
    });
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!product) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text className="text-foreground text-lg">Produto não encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-semibold">Voltar</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4 border-b border-border">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-4">
              <TouchableOpacity onPress={() => router.back()}>
                <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-foreground">Editar Produto</Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push(`/products/history/${productId}`)}
              className="px-4 py-2 bg-surface rounded-lg border border-border active:opacity-80"
            >
              <Text className="text-primary font-medium text-sm">Histórico</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
          {/* Current Stock (Read-only) */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="text-sm text-muted mb-1">Estoque Atual</Text>
            <Text className="text-2xl font-bold text-foreground">
              {product.currentQuantity} {units?.find((u) => u.id === product.unitId)?.abbreviation}
            </Text>
            <Text className="text-xs text-muted mt-1">
              Use "Entrada" ou "Saída" para alterar o estoque
            </Text>
          </View>

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
            disabled={updateProduct.isPending}
            className="bg-primary rounded-xl p-4 active:opacity-80 mt-4"
          >
            {updateProduct.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-background text-center font-semibold text-lg">
                Salvar Alterações
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
