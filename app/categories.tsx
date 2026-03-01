import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { supabase } from "@/lib/supabase";

type CategoryItem = {
  id: string;
  name: string;
  description: string | null;
};

export default function CategoriesScreen() {
  const router = useRouter();
  const colors = useColors();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, description")
        .order("name", { ascending: true });

      if (error) {
        setErrorMessage(error.message);
        setCategories([]);
        setIsLoading(false);
        return;
      }

      setCategories((data ?? []) as CategoryItem[]);
      setIsLoading(false);
    };

    loadCategories();
  }, []);

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center gap-4 mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconSymbol name="arrow.left" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-3xl font-bold text-foreground">Categorias</Text>
              <Text className="text-sm text-muted mt-1">Gerenciar categorias cadastradas</Text>
            </View>
          </View>

          {/* Add New Category Button */}
          <TouchableOpacity
            onPress={() => router.push("/add-category" as any)}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <IconSymbol name="plus" size={20} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              Nova Categoria
            </Text>
          </TouchableOpacity>
        </View>

        {/* Categories List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : errorMessage ? (
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-warning text-center">Erro ao carregar categorias: {errorMessage}</Text>
          </View>
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 24, gap: 12 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <IconSymbol name="cube.box.fill" size={48} color={colors.muted} />
                <Text className="text-muted text-center mt-4">
                  Nenhuma categoria cadastrada
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push(`/edit-category?id=${item.id}`)}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 gap-1">
                    <Text className="text-lg font-semibold text-foreground">
                      {item.name}
                    </Text>
                    {item.description && (
                      <Text className="text-sm text-muted" numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                  <View className="ml-4">
                    <IconSymbol name="pencil" size={20} color={colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
